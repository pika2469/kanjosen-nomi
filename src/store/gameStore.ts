import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Player, Settings, GameStateSlice, Phase, Mood, Page, UiState, Direction, CardId, PassiveId, DrinkResult } from '../types/game'
import { loadPlayers, loadSettings, saveSettings, upsertPlayer, removePlayer, replacePlayers, resetAll } from '../lib/db'
import { MOODS } from '@/constants/mood'
import { getNextStationId } from '@/utils'
import { pickStationEvent } from '@/stationEvents'
import { calcDrinkForPlayer } from '@/drinkLogic'
import { applyXpAndLevelUp, calcTurnXpFromDrinks } from '@/xpLogic'
import { drawRandomCardId, getCardById } from '@/cards'
import { getPassiveId, canUnlockPassive } from '@/passives'

// Store型の定義
type Store = {
    
    //  -------- グローバル変数 --------
    // 接続データ
    settings: Settings
    players: Player[]

    // 進行データ
    game: GameStateSlice

    // ページ情報
    // ui: {
    //     currentPage: Page
    // }
    ui: UiState

    // --------- 関数 -----------------
    // 初期化/復元 : 起動時にDBから設定・プレイヤーを読み込み、ストアに反映
    bootstrap: () => Promise<void>

    // 設定：設定の一部を更新し、ストア&DBの両方に反映
    setSettings: (patch: Partial<Settings>) => Promise<void>

    // ページ遷移
    page: Page
    setPage: (page: Page) => void

    // プレイヤー
    addPlayer: (name: string, style: Player['style']) => Promise<void>
    deletePlayer: (id: string) => Promise<void>
    setPlayerLi : (id: string, Li: number) => Promise<void>

    // 進行
    setMood: (mood: Mood | null) => void
    setPhase: (phase: Phase) => void
    setPhasePlayerIndex: (index: number | null) => void
    nextTurn: () => void
    proceedPhase: () => void

    // データ削除
    resetAllData: () => Promise<void>

    // ルーレット関連
    spinMood: () => void
    clearMood: () => void

    // 駅ロジック
    moveStation: (steps: number, direction: Direction) => void

    // 駅決定+駅イベント決定をまとめて行う(stationフェーズ用)
    runStationPhase: (steps: number, direction: Direction) => void

    // 杯数抽選ロジック(roll フェーズ用)
    runRollPhase: () => void
    runRollPhaseForPlayer: (playerIndex: number) => void

    // 成長判定
    runProgressPhase: () => void

    // カード系アクション
    drawCard: (playerId: string) => void
    drawToAll: () => void
    clearHands: () => void
    useCard: (playerId: string, cardId: CardId) => void

    // パッシブ関連
    unlockPassive: (playerId: string, passiveId: PassiveId) => void
}

// Zustandストア本体
export const useGameStore = create<Store>((set, get) => ({
    players: [],
    page: 'result',

    // -------------------------------------------------------
    // 初期化
    // -------------------------------------------------------
    settings: {
        allowDuplicateStations: true,
        sound: true,
        safety: true,
    },

    game: {
        phase: 'mood',
        turn: 1,
        mood: null,
        activePlayerIndex: 0,
        phasePlayerIndex: null,
        currentStation: null,
        visitedStations: [],
        currentEvent: null,
        currentDrinks: [],
        lastUsedCard: null,
        cardUsageBlockedForPlayerId: null,
    },

    ui: {
        currentPage: 'home',
    },

    // setPage: (page) => set({ page }),
    setPage: (page) =>
        set((state) => ({
            ...state,
            ui: {
                ...state.ui,
                currentPage: page,
            },            
        })),

    // -------------------------------------------------------
    // データ保存関連
    // -------------------------------------------------------
    // 起動時の復元処理
    bootstrap: async () => {
        const [s, ps] = await Promise.all([loadSettings(), loadPlayers()])
        set({
            settings: { allowDuplicateStations: s.allowDuplicateStations, sound: s.sound, safety: s.safety },
            players: ps,
        })
    },

    // 設定を部分的に更新
    setSettings: async (patch) => {
        const next = { ...get().settings, ...patch }
        set({ settings: next })
        await saveSettings(next)
    },

    addPlayer: async (name, style) => {
        const p: Player = {
            id: nanoid(),
            name,
            style,
            level: 1,
            xp: 0,
            sp: 0,
            Li: 1,
            handSizeMax: 2,
            passives: [],
            hand: [],
            nextTurnExtraDraw: 0,
            nextTurnPlusBias: false,
        }
        set((state) => ({
            players: [...state.players, p],
        }))
        await upsertPlayer(p)
    },

    deletePlayer: async (id) => {
        set({ players: get().players.filter(p => p.id !== id) }) // idに一致するデータのみ残す
        await removePlayer(id)
    },

    // プレイヤーの下限杯数変更 + 永続化
    setPlayerLi: async (id, Li) => {
        const next = get().players.map(p => p.id === id ? { ...p, Li } : p)
        set({ players: next })
        await replacePlayers(next)
    },

    // データ初期化
    resetAllData: async () => {
        const { bootstrap } = get()

        // 1) IndexedDBリセット
        await resetAll()

        // 2) Zustand側のplayers, gameステートを初期化
        set({
            players: [],
            game: {
                phase: 'mood',
                turn: 1,
                activePlayerIndex: 0,
                phasePlayerIndex: null,
                mood: null,
                currentStation: null,
                visitedStations: [],
                currentEvent: null,
                currentDrinks: [],
                lastUsedCard: null,
                cardUsageBlockedForPlayerId: null,
            },
        })

        // 3) bootstrap (設定読込など)
        await bootstrap()   
    },


    // -------------------------------------------------------
    // フェーズ進行
    // -------------------------------------------------------
    setPhase: (phase) =>
        set((state) => ({
            game: {
                ...state.game,
                phase,
            },
        })),
    
    // 操作中のプレイヤーIDを取得
    setPhasePlayerIndex: (index) =>
        set((state) => ({
            game: {
                ...state.game,
                phasePlayerIndex: index,
            },
        })),

    // ターン遷移 + 変数初期化
    nextTurn: () => {
        const g = get().game
        const nextIdx = (g.activePlayerIndex + 1) % Math.max(1, get().players.length || 1)
        set({
            game: {
                ...g,
                turn: g.turn + 1,   // ターン数+1
                phase: 'mood',
                mood: null,
                activePlayerIndex: nextIdx, // 代表プレイヤーを次のプレイヤーへ移動
                currentDrinks: [],
                currentEvent: null,
                lastUsedCard: null,
                cardUsageBlockedForPlayerId: null,
            },
        })
    },

    // フェーズ管理（フェーズステートマシン）
    proceedPhase: () => {
        const { game, players } = get()
        const playerCount = players.length

        // プレイヤーがいない場合はなにもしない
        if (playerCount === 0) return

        const currentPhase = game.phase     // 現在のフェーズ
        const idx = game.phasePlayerIndex   // 操作中のプレイヤーID

        // フェーズ1(ムードルーレット): この関数では処理しない。フェーズ2へ進む
        if (currentPhase === 'mood') {
            set((state) => ({
                game: {
                    ...state.game,
                    phase: 'station',
                    phasePlayerIndex: null,
                },
            }))
            return
        }

        // フェーズ2(駅決定): この関数では処理しない。フェーズ3へ進む
        if (currentPhase === 'station') {
            set((state) => ({
                game: {
                    ...state.game,
                    phase: 'stationEvent',
                    phasePlayerIndex: null,
                },
            }))
            return
        }

        // フェーズ3(駅イベント): フェーズ4に必要な変数を準備して移動
        if (currentPhase === 'stationEvent') {
            set((state) => ({
                game: {
                    ...state.game,
                    phase: 'roll',
                    phasePlayerIndex: 0,    // 最初のプレイヤーをセット
                    currentDrinks: [],      // リセット
                },
            }))
            return
        }

        // フェーズ4(杯数抽選):
        if (currentPhase === 'roll') {
            // 操作中プレイヤーが見つからない場合は、フェーズをstationEventに戻す（安全処置）
            if (idx == null) {
                set((state) => ({
                    game: { ...state.game, phase: 'stationEvent' },
                }))
                return
            }

            // idx番目のプレイヤーの杯数だけ抽選
            get().runRollPhaseForPlayer(idx)

            // 抽選が終わったら、そのプレイヤーでフェーズ5(カードドロー)へ進む
            set((state) => ({
                game: {
                    ...state.game,
                    phase: 'draw',
                    phasePlayerIndex: idx,
                },
            }))
            return
        }

        // フェーズ5(カードドロー):
        if (currentPhase === 'draw') {
            if (idx == null) {
                set((state) => ({
                    game: { ...state.game, phase: 'roll', phasePlayerIndex: 0 },
                }))
                return
            }

            // 現在の操作プレイヤーがカードを引く
            const stateBefore = get()
            const player = stateBefore.players[idx]
            if (player) {
                const extra = player.nextTurnExtraDraw ?? 0 // nextTurnExtraDrawはnumber型

                // ベースの1ドロー
                stateBefore.drawCard(player.id)

                // 追加ドロー
                if (extra > 0) {
                    for (let i = 0; i < extra; i++) {
                        stateBefore.drawCard(player.id)
                    }

                    // 追加ドローが終わったらnextTurnExtraDrawを0に戻す
                    set((state) => ({
                        ...state,
                        players: state.players.map((p, pIdx) =>
                            pIdx === idx
                            ? { ...p, nextTurnExtraDraw: 0 }
                            : p,
                        ),
                    }))
                }
            }

            // 次の処理分岐
            if (idx + 1 < playerCount) {
                // まだ次のプレイヤーがいる場合は、次のプレイヤーのフェーズ4へ移動
                set((state) => ({
                    game: {
                        ...state.game,
                        phase: 'roll',
                        phasePlayerIndex: idx + 1,
                    },
                }))
            } else {
                // 全員の処理が終了した場合は、フェーズ6へ移動
                set((state) => ({
                    game: {
                        ...state.game,
                        phase: 'useCards',
                        phasePlayerIndex: 0,
                    },
                }))
            }
            return
        }

        // フェーズ6(カード使用):
        if (currentPhase === 'useCards') {
            if (idx == null) {
                set((state) => ({
                    game: {
                        ...state.game,
                        phase: 'progress',
                        phasePlayerIndex: null,
                    },
                }))
                return
            }

            // カード操作はUI側で実行する想定するので、ここでは何も処理しない
            if (idx + 1 < playerCount) {
                // まだ次のプレイヤーがいる場合は、次のプレイヤーのフェーズ6へ移動
                set((state) => ({
                    game: {
                        ...state.game,
                        phase: 'useCards',
                        phasePlayerIndex: idx + 1,
                    },
                }))
            } else {
                // 全員の処理が終了した場合は、フェーズ7へ移動
                set((state) => ({
                    game: {
                        ...state.game,
                        phase: 'progress',
                        phasePlayerIndex: null,
                    },
                }))
            }
            return
        }

        // フェーズ7(成長判定): runProgressPhaseでXP/Lv/SPを更新
        if (currentPhase === 'progress') {
            get().runProgressPhase()
            set((state) => ({
                game: {
                    ...state.game,
                    phase: 'result',
                    phasePlayerIndex: null,
                },
            }))
            return
        }

        // フェーズ8(結果表示): nextTurnを呼び出してターン移動
        if (currentPhase === 'result') {
            get().nextTurn() // phase='mood' / phasePlayerIndex=nullに戻す
            return
        }
    },

    
    // -------------------------------------------------------
    // フェーズ1: ムードルーレット
    // -------------------------------------------------------
    spinMood: () => {
        const moods = MOODS
        if (moods.length === 0) return

        const idx = Math.floor(Math.random() * moods.length)
        const picked = moods[idx]

        set((state) => ({
            game: {
                ...state.game,
                mood: picked.id // id=Moodの情報を追加
            },
        }))
    },

    clearMood: () => {
        set((state) => ({
            game: {
                ...state.game,
                mood: null,
            },
        }))
    },

    setMood: (mood) => set({ game: { ...get().game, mood } }),

    // -------------------------------------------------------
    // フェーズ2, 3: 駅決定, 駅イベント
    // -------------------------------------------------------
    // 駅を移動
    moveStation: (steps, direction) => {
        const { game, settings } = get()
        const nextId = getNextStationId(
            game.currentStation,
            steps,
            direction,
            settings.allowDuplicateStations,
            game.visitedStations,
        )

        set((state) => ({
            game: {
                ...state.game,
                currentStation: nextId,
                visitedStations: state.game.visitedStations.includes(nextId) 
                ? state.game.visitedStations
                : [...state.game.visitedStations, nextId],
            },
        }))
    },

    // 駅決定+駅イベント決定
    runStationPhase: (steps, direction) => {
        const { game, settings } = get()

        // 1: 次の駅を決める
        const nextId = getNextStationId(
            game.currentStation,
            steps,
            direction,
            settings.allowDuplicateStations,
            game.visitedStations,
        )

        // 2: 駅属性からイベントを1つ選ぶ
        const event = pickStationEvent(nextId)

        // 3: state更新
        set((state) => {

            // 現在の代表プレイヤーを取得
            const activePlayer = state.players[state.game.activePlayerIndex]

            // 訪問済駅リストを更新
            const alreadyVisited = state.game.visitedStations.includes(nextId)
            const newVisited = alreadyVisited
                ? state.game.visitedStations
                : [...state.game.visitedStations, nextId]
            
            let updatedPlayers = state.players
            let cardUsageBlockedForPlayerId = state.game.cardUsageBlockedForPlayerId

            // 乗換イベントA: 代表カードドロー+1枚
            if (event && event.cardEffect === 'rep_draw_plus1' && activePlayer) {
                updatedPlayers = state.players.map((p) => {
                    if (p.id !== activePlayer.id) return p

                    // 手札が上限ならドローしない
                    if (p.hand.length >= p.handSizeMax) {
                        return p
                    }

                    const newCardId = drawRandomCardId()
                    return {
                        ...p,
                        hand: [...p.hand, newCardId],
                    }
                })
            }

            // 乗換イベントB: 代表はこのターンカード使用不可
            if (event && event.cardEffect === 'rep_skip_action' && activePlayer) {
                cardUsageBlockedForPlayerId = activePlayer.id
            }

            return {
                ...state,
                players: updatedPlayers,
                game: {
                    ...state.game,
                    currentStation: nextId,
                    visitedStations: newVisited,
                    currentEvent: event,
                    cardUsageBlockedForPlayerId,
                },
            }
        })
    },
    
    // -------------------------------------------------------
    // フェーズ4: 杯数抽選
    // -------------------------------------------------------
    
    // 杯数抽選（デバッグ用）
    runRollPhase: () => {
        const { players, game, settings } = get()

        // プレイヤーがいなければ何もしない
        if (!players || players.length === 0) {
            set((state) => ({
                game: {
                    ...state.game,
                    currentDrinks: [],
                },
            }))
            return
        }

        const activePlayer = players[game.activePlayerIndex] ?? null
        const activePlayerId = activePlayer ? activePlayer.id : null

        const results: DrinkResult[] = players.map((p) => 
            calcDrinkForPlayer(
                p,
                game.mood,
                game.currentEvent, 
                settings.safety,
                activePlayerId,
                players,                
            ),
        )

        set((state) => ({
            game: {
                ...state.game,
                currentDrinks: results,
            },
        }))
    },

    // 杯数抽選（プレイヤー毎）
    runRollPhaseForPlayer: (playerIndex: number) => {
        const { players, game, settings } = get()
        const target = players[playerIndex]
        if (!target) return

        // 代表プレイヤー判定
        const activePlayer = players[game.activePlayerIndex] ?? null
        const activePlayerId = activePlayer ? activePlayer.id : null

        const result = calcDrinkForPlayer(
            target,
            game.mood,
            game.currentEvent,
            settings.safety,
            activePlayerId,
            players,
        )

        set((state) => {
            // 同じplayerIdの結果があれば上書き、なければ追加
            const others = state.game.currentDrinks.filter(
                (r) => r.playerId !== result.playerId,
            )

            // nextTurnPlusBias一時フラグを初期化
            const newPlayers = state.players.map((p, idx) =>
                idx === playerIndex
                ? { ...p, nextTurnPlusBias: false }
                : p,
            )

            return {
                players: newPlayers,
                game: {
                    ...state.game,
                    currentDrinks: [...others, result],
                },
            }
        })
    },

    
    // -------------------------------------------------------
    // フェーズ5: カードドロー
    // -------------------------------------------------------
    drawCard: (playerId) => {
        set((state) => {
            const players = state.players.map((p) => {
                if (p.id !== playerId) return p

                // 処理対象のプレイヤーの場合
                // 手札が上限値以上の場合はカードは引かない
                if (p.hand.length >= p.handSizeMax) {
                    return p
                }

                // カードを引く処理
                const newCardId = drawRandomCardId(p)
                return {
                    ...p,
                    hand: [...p.hand, newCardId],
                }
            })

            return { ...state, players }
        })
    },

    drawToAll: () => {
        set((state) => {
            const players = state.players.map((p) => {
                if (p.hand.length >= p.handSizeMax) {
                    return p
                }
                const newCardId = drawRandomCardId()
                return {
                    ...p,
                    hand: [...p.hand, newCardId],
                }
            })

            return { ...state, players }
        })
    },

    clearHands: () => {
        set((state) => {
            const players = state.players.map((p) => ({
                ...p,
                hand: [],
            }))

            return { ...state, players }
        })
    },

    useCard: (playerId: string, cardId: CardId) => {
        const stateBefore = get()
        const card = getCardById(cardId)
        if (!card) return

        // このターンカード使用禁止なら何もしない
        if (stateBefore.game.cardUsageBlockedForPlayerId === playerId) {
            return 
        }

        // 処理対象のプレイヤーを取得
        const player = stateBefore.players.find((p) => p.id === playerId)
        if (!player) return

        // まず手札からカードを取り除く
        // 次ターン用のフラグを更新
        let updatedPlayers = stateBefore.players.map((p) => {
            if (p.id !== playerId) return p

            const newHand = [...p.hand]
            const idx = newHand.indexOf(cardId)
            if (idx >= 0) newHand.splice(idx, 1) // handのidx番目のカードを取り除く
    
            let nextTurnExtraDraw = p.nextTurnExtraDraw
            let nextTurnPlusBias = p.nextTurnPlusBias

            switch (card.id) {
                case 'sp_draw_plus1':
                    // 次ターンのドロー+1
                    nextTurnExtraDraw = (nextTurnExtraDraw ?? 0) + 1
                    break
                
                case 'safe_karume':
                    // 軽めにいくわ → 次ターンの+側バイアスを付与
                    nextTurnPlusBias = true
                    break
            }
            
            return {
                ...p,
                hand: newHand,
                nextTurnExtraDraw,
                nextTurnPlusBias,
            }
        })

        // currentDrinksをベースにカード効果を適用
        let updatedDrinks = [...stateBefore.game.currentDrinks]

        // 引数1: targetPlayerId...対象のプレイヤー
        // 引数2: コールバック関数 updater ... dとplayerを引数に、変化させたDrinkResult型を返す
        const applyToDrink = (
            targetPlayerId: string,
            updater: (d: DrinkResult, player: Player) => DrinkResult,
        ) => {
            const tPlayer = updatedPlayers.find((p) => p.id === targetPlayerId)
            if (!tPlayer) return

            const existing = updatedDrinks.find(
                (d) => d.playerId === targetPlayerId,
            )
            if (!existing) {
                // まだ杯数抽選されていない場合は何も行わない
                return
            }

            updatedDrinks = updatedDrinks.map((d) =>
                d.playerId === targetPlayerId ? updater(d, tPlayer) : d,
            )
        }

        // カードごとの効果分岐
        switch (card.id) {
            case 'safe_non_alcohol': {
                // ノンアル券：このターン杯数0固定
                applyToDrink(playerId, (d) => ({
                    ...d,
                    final: 0,
                }))
                break
            }

            case 'safe_hitoyasumi': {
                // ひとやすみ：自分-1杯(下限Liまで)
                applyToDrink(playerId, (d, p) => {
                    const next = d.final - 1
                    const min = p.Li ?? 0
                    return {
                        ...d,
                        final: next < min ? min : next,
                    }
                })
                break
            }

            case 'sp_reverse': {
                // リバース：全員の最終杯数を反転
                updatedDrinks = updatedDrinks.map((d) => {
                    const v = d.final
                    let next = v
                    if (v === 1) next = 5
                    else if (v === 2) next = 4
                    else if (v === 4) next = 2
                    else if (v === 5) next = 1

                    return {
                        ...d,
                        final: next,
                    }
                })
                break
            }

            case 'sp_reroll': {
                // リロール：自分の杯数を再抽選
                const { game, settings, players } = stateBefore

                // カード使用プレイヤーが代表プレイヤーかどうか判断
                const active = stateBefore.players[game.activePlayerIndex]
                const activeId = active ? active.id : null
                
                // カード使用プレイヤーに対して、再抽選を実行
                const newResult = calcDrinkForPlayer(
                    player,
                    game.mood,
                    game.currentEvent,
                    settings.safety,
                    activeId,
                    players,
                )
                
                // カードを使ったプレイヤーのみ最終杯数を置き換える
                updatedDrinks = updatedDrinks.map((d) =>
                    d.playerId === playerId ? newResult : d,
                )
                break
            }

            case 'safe_karume': {
                // 軽めにいくわ：このターン-2杯(下限Liまで)
                applyToDrink(playerId, (d, p) => {
                    const min = p.Li ?? 0
                    const next = Math.max(min, d.final - 2)
                    return {
                        ...d,
                        final: next,
                    }
                })
                break
            }

            case 'sp_draw_plus1': {
                // ドロー+1：次のターンのドロー+1枚。今ターンの杯数には影響しないので何もしない
                break
            }

            default:
                // それ以外のカードは今のところ「効果なし」で消費だけ行う
                break
        }

        // lastUseCardの更新
        const updatedGame = {
            ...stateBefore.game,
            currentDrinks: updatedDrinks,
            lastUsedCard: {
                playerId,
                cardId,
                usedAtTurn: stateBefore.game.turn,
            },
        }

        set({
            ...stateBefore,
            players: updatedPlayers,
            game: updatedGame,
        })
    
    },

    // -------------------------------------------------------    
    // フェーズ7: 成長判定
    // -------------------------------------------------------
    runProgressPhase: () => {
        const { players, game } = get()
        const drinks = game.currentDrinks

        if (!players || players.length === 0) {
            return
        }
        if (!drinks || drinks.length === 0) {
            return
        }

        // playerID → 今ターン獲得XPのマップを作る
        const xpMap = new Map<string, number>()

        for (const r of drinks) {
            const gained = calcTurnXpFromDrinks(r.final)
            const prev = xpMap.get(r.playerId) ?? 0
            xpMap.set(r.playerId, prev + gained)
        }

        // 各プレイヤーにXPを加算し、必要ならレベルアップ&SP加算
        const updatedPlayers = players.map((p) => {
            const gainedXp = xpMap.get(p.id) ?? 0
            if (gainedXp <= 0) return p
            return applyXpAndLevelUp(p, gainedXp)
        })

        set(() => ({
            players: updatedPlayers,
        }))
    },

    // -------------------------------------------------------
    // パッシブスキル関連
    // -------------------------------------------------------
    unlockPassive: (playerId, passiveId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (!player) return

        const node = getPassiveId(passiveId)
        if (!node) return

        // アンロック条件を満たさない場合は処理スキップ
        if (!canUnlockPassive(player, node)) {
            return
        }

        // アンロック
        const updatedPlayers = state.players.map((p) => {
            if (p.id !== playerId) return p

            return {
                ...p,
                sp: p.sp - node.costSp,
                passives: [...p.passives, node.id],
            }
        })

        set({ players: updatedPlayers })
    },

}))

