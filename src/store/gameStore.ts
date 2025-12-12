import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Player, Settings, GameStateSlice, Phase, Mood, Page, UiState, Direction, CardId, PassiveId, DrinkResult, DualRollChoice } from '../types/game'
import { loadPlayers, loadSettings, saveSettings, upsertPlayer, removePlayer, replacePlayers, resetAll } from '../lib/db'
import { MOODS } from '@/constants/mood'
import { getNextStationId } from '@/utils'
import { pickStationEvent } from '@/stationEvents'
import { calcDrinkForPlayer, clampFinalWithAllCaps } from '@/drinkLogic'
import { applyXpAndLevelUp, calcTurnXpFromDrinks } from '@/xpLogic'
import { drawRandomCardId, getCardById } from '@/cards'
import { getPassiveId, canUnlockPassive, hasAttackTease, hasAttackTrigger } from '@/passives'

// カード処理に使うヘルパー群
// 自分以外からランダムにcount人のプレイヤーIDを取得する関数
function pickRandomOtherPlayerIds(
    players: Player[],
    selfId: string,
    count: number,
): string[] {
    const others = players.filter((p) => p.id !== selfId)
    if (others.length === 0) return []

    // ランダム並び替え
    const shuffled = [...others].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, others.length)).map((p) => p.id)
}

// DrinkResult配列に対して、対象ID群に+amountする関数
function plusToTargets(
    drinks: DrinkResult[],
    targetIds: string[],
    amount: number,
): DrinkResult[] {
    if (amount === 0 || targetIds.length === 0) return drinks
    
    return drinks.map((d) => {
        if (!targetIds.includes(d.playerId)) return d

        // 上限はここではclampせず、最終的なバランス調整フェーズで検討
        return {
            ...d,
            final: d.final + amount,
        }
    })
}

// スルーガード用：今ターン中「他プレイヤーからの加算」を無効化するプレイヤーID一覧
let slueGuardedThisTurn: string[] = []

// フィールドブレイク用：今ターン中、セーフガード効果を無効化するフラグ
let fieldBreakActiveThisTurn = false


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
    setPlayerMaxDrink: (id: string, maxDrink: number) => Promise<void>

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

    // デュアルロール用
    resolveDualRoll: (choice: DualRollChoice) => void

    // 成長判定
    runProgressPhase: () => void

    // カード系アクション
    drawCard: (playerId: string) => void
    drawToAll: () => void
    drawForDrawPhase: (playerId: string) => void
    clearHands: () => void
    useCard: (playerId: string, cardId: CardId, targetPlayerid?: string) => void

    // パッシブ関連
    unlockPassive: (playerId: string, passiveId: PassiveId) => void

    // 強制パッシブ付与（デバッグ用）
    debugGrantPassive: (playerId: string, passiveId: PassiveId) => void
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
        startStationId: 'osaka',
    },

    game: {
        phase: 'mood',
        turn: 1,
        mood: null,
        activePlayerIndex: 0,
        phasePlayerIndex: null,
        currentStation: null,
        visitedStations: [],
        lastStationSteps: null,
        lastStationDirection: null,
        currentEvent: null,
        currentDrinks: [],
        lastUsedCard: null,
        cardUsageBlockedForPlayerId: null,
        boostRareUsedForTurn: false,
        dualRollPending: null,
        drawnPlayerIds: [],
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

        const defaultStartStationId = 'osaka'

        set({
            settings: { 
                allowDuplicateStations: s.allowDuplicateStations, 
                sound: s.sound, 
                safety: s.safety,
                startStationId: s.startStationId ?? defaultStartStationId,
             },
            players: ps,
        })
    },

    // 設定を部分的に更新
    setSettings: async (patch) => {
        const prevSettings = get().settings
        const next = { ...prevSettings, ...patch }

        set((state) => {
            let game = state.game

            // 開始駅が変更され、かつゲームが初期状態の場合
            if ('startStationId' in patch && patch.startStationId) {
                const isInitialGameState =
                    game.turn === 1 &&
                    game.phase === 'mood' &&
                    game.currentStation === null &&
                    game.visitedStations.length === 0
                
                if (isInitialGameState) {
                    game = {
                        ...game,
                        currentStation: patch.startStationId,
                    }
                }
            }

            return {
                ...state,
                settings: next,
                game,
            }
        })

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
            nextTurnSlowBias: false,
            maxDrink: 5,
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

    // 各プレイヤーの最大杯数
    setPlayerMaxDrink: async (id, maxDrink) => {
        const next = get().players.map((p) =>
            p.id === id ? { ...p, maxDrink } : p,
        )
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
                lastStationSteps: null,
                lastStationDirection: null,
                currentEvent: null,
                currentDrinks: [],
                lastUsedCard: null,
                cardUsageBlockedForPlayerId: null,
                boostRareUsedForTurn: false,
                dualRollPending: null,
                drawnPlayerIds: [],
            },
        })

        // スルーガードもクリア
        slueGuardedThisTurn = []

        // フィールドブレイクもクリア
        fieldBreakActiveThisTurn = false

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
                boostRareUsedForTurn: false,
                lastStationSteps: null,
                lastStationDirection: null,
                drawnPlayerIds: [],
            },
        })

        // スルーガード状態はターン終了時にリセット
        slueGuardedThisTurn = []

        // フィールドブレイク状態もターン終了時にリセット
        fieldBreakActiveThisTurn = false
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

        // フェーズ2(駅決定): ランダムに「何駅進むか」「方向」を決定して、駅+駅イベントを確定
        if (currentPhase === 'station') {
            // 1~6駅のいずれをランダムに選ぶ
            const steps = Math.floor(Math.random() * 6) + 1

            // 時計周り / 反時計回り を50%でランダム決定
            const direction: Direction = Math.random() < 0.5 ? 'cw' : 'ccw'

            // 駅移動 + 駅イベント決定
            get().runStationPhase(steps, direction)

            // フェーズ3(stationEvent)へ進める
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
            // if (player) {
            //     const extra = player.nextTurnExtraDraw ?? 0 // nextTurnExtraDrawはnumber型

            //     // ベースの1ドロー
            //     stateBefore.drawCard(player.id)

            //     // 追加ドロー
            //     if (extra > 0) {
            //         for (let i = 0; i < extra; i++) {
            //             stateBefore.drawCard(player.id)
            //         }

            //         // 追加ドローが終わったらnextTurnExtraDrawを0に戻す
            //         set((state) => ({
            //             ...state,
            //             players: state.players.map((p, pIdx) =>
            //                 pIdx === idx
            //                 ? { ...p, nextTurnExtraDraw: 0 }
            //                 : p,
            //             ),
            //         }))
            //     }
            // }

            if (player) {
                get().drawForDrawPhase(player.id)
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
        const baseStationId = game.currentStation ?? settings.startStationId

        const nextId = getNextStationId(
            baseStationId,
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

                const newCardId = drawRandomCardId(p)
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
                lastStationSteps: steps,
                lastStationDirection: direction,
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

        const hasDualRoll = target.passives?.includes('trick_dual_roll')

        if (!hasDualRoll) {
            // デュアルロールを持っていない場合、通常の1回ロール
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

                // nextTurnPlusBiasとnextTurnSlowBias一時フラグを初期化
                const newPlayers = state.players.map((p, idx) =>
                    idx === playerIndex
                        ? { ...p, nextTurnPlusBias: false, nextTurnSlowBias: false }
                        : p,
                )

                return {
                    players: newPlayers,
                    game: {
                        ...state.game,
                        currentDrinks: [...others, result],
                        dualRollPending: null,
                    },
                }
            })
            return
        }

        // デュアルロール処理
        // 1回目
        const resultA = calcDrinkForPlayer(
            target,
            game.mood,
            game.currentEvent,
            settings.safety,
            activePlayerId,
            players,
        )

        // 2回目
        const resultB = calcDrinkForPlayer(
            target,
            game.mood,
            game.currentEvent,
            settings.safety,
            activePlayerId,
            players,
        )
        // デュアルロール中は currentDrinks をまだ確定しない
        // とりあえず nextTurnPlusBias はリセットする
        set((state) => {
            const newPlayers = state.players.map((p, idx) =>
                idx === playerIndex
                    ? {...p, nextTurnPlusBias: false}
                    : p,
            )

            return {
                players: newPlayers,
                game: {
                    ...state.game,
                    dualRollPending: {
                        playerId: target.id,
                        optionA: resultA,
                        optionB: resultB,
                    },
                },
            }
        })
    },

    resolveDualRoll: (choice) => {
        const stateBefore = get()
        const pending = stateBefore.game.dualRollPending
        if (!pending) return

        const chosen = choice === 'A' ? pending.optionA : pending.optionB

        set((state) => {
            // まず同じplayerIdの既存結果を除外
            const others = state.game.currentDrinks.filter(
                (r) => r.playerId !== pending.playerId,
            )

            return {
                ...state,
                game: {
                    ...state.game,
                    currentDrinks: [...others, chosen],
                    dualRollPending: null,
                },
            }
        })
    },

    
    // -------------------------------------------------------
    // フェーズ5: カードドロー
    // -------------------------------------------------------
    drawCard: (playerId) => {
        set((state) => {
            const isBalance = state.game.mood === 'balance'
            let boostUsed = state.game.boostRareUsedForTurn ?? false

            const players = state.players.map((p, idx) => {
                if (p.id !== playerId) return p

                // 処理対象のプレイヤーの場合
                // 手札が上限値以上の場合はカードは引かない
                if (p.hand.length >= p.handSizeMax) {
                    return p
                }

                // 代表プレイヤーかどうか
                const isRep = idx === state.game.activePlayerIndex

                // レア(R/SR)出現フラグ
                const forceRareOnly = isBalance && isRep && !boostUsed

                // カードを引く処理
                const newCardId = drawRandomCardId(p, {
                    mood: state.game.mood,
                    forceRareOnly,
                })

                if (forceRareOnly) {
                    boostUsed = true
                }

                return {
                    ...p,
                    hand: [...p.hand, newCardId],
                }
            })

            // drawフェーズのときだけ、「このターンのドロー済み」を立てる
            let drawnPlayerIds = state.game.drawnPlayerIds ?? []
            if (state.game.phase === 'draw') {
                if (!drawnPlayerIds.includes(playerId)) {
                    drawnPlayerIds = [...drawnPlayerIds, playerId]
                }
            }

            return { 
                ...state, 
                players,
                game: {
                    ...state.game,
                    boostRareUsedForTurn: boostUsed,
                    drawnPlayerIds,
                },
            }
        })
    },

    drawToAll: () => {
        set((state) => {
            const isBalance = state.game.mood === 'balance'
            let boostUsed = state.game.boostRareUsedForTurn ?? false

            const players = state.players.map((p, idx) => {
                if (p.hand.length >= p.handSizeMax) {
                    return p
                }

                const isRep = idx === state.game.activePlayerIndex
                const forceRareOnly = isBalance && isRep && !boostUsed

                const newCardId = drawRandomCardId(p, {
                    mood: state.game.mood,
                    forceRareOnly,
                })

                if (forceRareOnly) {
                    boostUsed = true
                }

                return {
                    ...p,
                    hand: [...p.hand, newCardId],
                }
            })

            return { 
                ...state, 
                players,
                game: {
                    ...state.game,
                    boostRareUsedForTurn: boostUsed,
                },
            }
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

    // 追加ドロー(nextTurnExtraDraw)も考慮したドロー関数
    drawForDrawPhase: (playerId: string) => {
        set((state) => {
            // drawフェーズ以外で呼ばれても安全側に倒す
            if (state.game.phase !== 'draw') return state

            const isBalance = state.game.mood === 'balance'
            let boostUsed = state.game.boostRareUsedForTurn ?? false

            const target = state.players.find((p) => p.id === playerId)
            if (!target) return state

            const extra = target.nextTurnExtraDraw ?? 0
            const total = 1 + Math.max(0, extra)

            const players = state.players.map((p, idx) => {
                if (p.id !== playerId) return p

                let hand = [...p.hand]

                // 代表プレイヤーかどうか（balanceの R/SR 強制判定用）
                const isRep = idx === state.game.activePlayerIndex

                for (let i = 0; i < total; i++) {
                    // 手札が上限なら引かない
                    if (hand.length >= p.handSizeMax) break

                    const forceRareOnly = isBalance && isRep && !boostUsed
                    const newCardId = drawRandomCardId(p, {
                        mood: state.game.mood,
                        forceRareOnly,
                    })

                    if (forceRareOnly) {
                        boostUsed = true
                        hand.push(newCardId)
                    }
                }

                return {
                    ...p,
                    hand,
                    nextTurnExtraDraw: 0,
                }
            })

            // drawnPlayerIdsはSet相当（重複させない）
            const drawnPlayerIds = state.game.drawnPlayerIds ?? []
            const nextDrawn =
                drawnPlayerIds.includes(playerId) ? drawnPlayerIds : [...drawnPlayerIds, playerId]

                return {
                    ...state,
                    players,
                    game: {
                        ...state.game,
                        boostRareUsedForTurn: boostUsed,
                        drawnPlayerIds: nextDrawn,
                    },
                }
        })
    },

    // -------------------------------------------------------    
    // フェーズ6: カード使用
    // -------------------------------------------------------
    useCard: (playerId: string, cardId: CardId, targetPlayerId?: string) => {
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

        // 今ターンのスルーガード状態をSetで扱う
        const guardedIds = new Set(slueGuardedThisTurn)

        // 今ターンのフィールドブレイク状態をローカルに保存
        const isFieldBreakActive = fieldBreakActiveThisTurn

        // １）手札からカードを取り除く & 次ターンのフラグ更新
        let updatedPlayers = stateBefore.players.map((p) => {
            if (p.id !== playerId) return p

            const newHand = [...p.hand]
            const idx = newHand.indexOf(cardId)
            if (idx >= 0) newHand.splice(idx, 1) // handのidx番目のカードを取り除く
            
            // 次ターン用のフラグを設置
            let nextTurnExtraDraw = p.nextTurnExtraDraw ?? 0
            let nextTurnPlusBias = p.nextTurnPlusBias ?? false

            switch (card.id) {
                case 'sp_draw_plus1':
                    // 次ターンのドロー+1
                    nextTurnExtraDraw += 1
                    break
                
                case 'safe_karume':
                    // 軽めにいくわ → 次ターンの+側バイアスを付与

                    // フィールドブレイクが有効な場合は、次ターンバイアスも無効
                    if (!isFieldBreakActive) {
                        nextTurnPlusBias = true
                    }

                    break
                
                default:
                    break
            }
            
            return {
                ...p,
                hand: newHand,
                nextTurnExtraDraw,
                nextTurnPlusBias,
            }
        })

        // 2) 今ターンの杯数(currentDrinks)に効果を適用
        let updatedDrinks = [...stateBefore.game.currentDrinks]

        // 引数1: targetPlayerId...対象のプレイヤー
        // 引数2: コールバック関数 updater ... dとplayerを引数に、変化させたDrinkResult型を返す
        const applyToDrink = (
            targetPlayerId: string,
            updater: (d: DrinkResult, player: Player) => DrinkResult,
        ) => {
            const tPlayer = updatedPlayers.find((p) => p.id === targetPlayerId)
            if (!tPlayer) return

            // 対象プレイヤーの杯数が抽選済か？
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

        const plusTo = (targetIds: string[], amount: number, sourcePlayerId: string) => {
            const effectiveTargets = targetIds.filter((tid) => {
                // ガードされていない → そのまま
                if (!guardedIds.has(tid)) return true

                return tid === sourcePlayerId
            })

            if (amount === 0 || effectiveTargets.length === 0) return            
            
            updatedDrinks = plusToTargets(
                updatedDrinks,
                effectiveTargets,
                amount,
            )
        }

        // カードごとの効果分岐

        // 攻撃パッシブ
        const hasTease = hasAttackTease(player) // アタックツリー1段階：煽り上手
        const hasTrigger = hasAttackTrigger(player) // アタックツリー3段階：攻撃トリガー

        switch (card.id) {
            case 'safe_non_alcohol': {
                // ノンアル券：このターン杯数0固定
                if (isFieldBreakActive) {
                    // フィールドブレイク中は効果無効（カードだけ消費）
                    break
                }
                applyToDrink(playerId, (d) => ({
                    ...d,
                    final: 0,
                }))
                break
            }

            case 'safe_hitoyasumi': {
                // ひとやすみ：自分-1杯(下限Liまで)
                if (isFieldBreakActive) {
                    break
                }
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

            case 'safe_karume': {
                // 軽めにいくわ：このターン-2杯(下限Liまで)
                if (isFieldBreakActive) {
                    break
                }
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

            case 'sp_draw_plus1': {
                // ドロー+1：次のターンのドロー+1枚。今ターンの杯数には影響しないので何もしない
                break
            }

            case 'sp_random_change': {
                // ランダムチェンジ
                // 今ターン杯数が確定しているプレイヤーの中からランダム2名を選び、その2名のfinalを入れ替える

                if (updatedDrinks.length < 2) {
                    // 対象が1人以下なら何もしない
                    break
                }

                // ランダムに2つの異なるインデックスを選ぶ
                const len = updatedDrinks.length
                const i = Math.floor(Math.random() * len)
                let j = Math.floor(Math.random() * (len -1))
                if (j >= i) j += 1 // j != iとなるように補正

                const newDrinks = [...updatedDrinks]

                // finalだけをスワップ
                const tempFinal = newDrinks[i].final
                newDrinks[i] = {
                    ...newDrinks[i],
                    final: newDrinks[j].final,
                }
                newDrinks[j] = {
                    ...newDrinks[j],
                    final: tempFinal,
                }

                updatedDrinks = newDrinks
                break
            }

            case 'safe_yukkuri_mode': {
                // ゆっくりモード
                // 次ターンの杯数抽選時に下限寄りに抽選

                if (isFieldBreakActive) {
                    break
                }

                if (!player) break;

                // 次ターン用のフラグを立てる
                set((state) => {
                    const updatedPlayers = state.players.map((p) => {
                        if (p.id === playerId) {
                            return {...p, nextTurnSlowBias: true};
                        }
                        return p;
                    });
                    return {...state, players: updatedPlayers};
                });

                break;
            }

            case 'safe_slue_guard': {
                // スルーカード
                // 今ターン中、他プレイヤーからの「+杯」効果を自分だけ無効化
                
                if (isFieldBreakActive) {
                    break
                }

                if (!player) break;

                guardedIds.add(playerId)
                break
            }

            case 'atk_hitokuchi_plus': {
                // ひとくちプラス: 自分以外ランダム1人に+1
                const baseTargets = 1
                const othersCount = updatedPlayers.length - 1
                const targetCount = 
                    othersCount <= 0 
                    ? 0
                    : Math.min(
                        othersCount,
                        hasTease ? baseTargets + 1 : baseTargets,
                    )
                    
                    // 対象プレイヤーID決定
                    const targets = pickRandomOtherPlayerIds(
                        updatedPlayers,
                        playerId,
                        targetCount,
                    )

                    if (targets.length > 0) {
                        plusTo(targets, 1, playerId)

                        // 攻撃トリガー: 50%で同じ対象にさらに+1
                        if (hasTrigger && Math.random() < 0.5) {
                            plusTo(targets, 1, playerId)
                        }
                    }
                    break 
            }

            case 'atk_michizure_plus': {
                // 道連れプラス：
                // ベース：自分+ランダム1人に+1
                // 煽り上手：自分+ランダム2人に+1
                const baseOthers = 1
                const othersCount = updatedPlayers.length - 1
                const targetOthers =
                    othersCount <= 0
                    ? 0
                    : Math.min(
                        othersCount,
                        hasTease ? baseOthers + 1 : baseOthers,
                    )
                
                const others = pickRandomOtherPlayerIds(
                    updatedPlayers,
                    playerId,
                    targetOthers,
                )

                // 対象は自分(playerId)とランダム選出した他プレイヤー(others)
                const targets = [playerId, ...others]

                if (targets.length > 0) {
                    plusTo(targets, 1, playerId)

                    // 攻撃トリガー：50%で同じ対象にさらに+1
                    if (hasTrigger && Math.random() < 0.5) {
                        plusTo(targets, 1, playerId)
                    }
                }
                break
            }

            case 'atk_minna_de_kanpai': {
                // みんなで乾杯:全員+1
                // ただしsafe_field_shield持ちは「自分に対する全体+1」を無効化する

                // フィールドシールド持ちのプレイヤーID一覧
                const shieldedIds = new Set(
                    updatedPlayers
                        .filter((p) => p.passives?.includes('safe_field_shield'))
                        .map((p) => p.id)
                )

                // 攻撃の発動者
                const sourceId = playerId

                // 実際に加算対象となるプレイヤー
                const baseTargets = updatedPlayers
                        .map((p) => p.id)
                        .filter((tid) => !shieldedIds.has(tid))
                
                // ベース+1
                plusTo(baseTargets, 1, sourceId)

                // 攻撃トリガー: 50%でさらに+1
                if (hasTrigger && Math.random() < 0.5) {
                    plusTo(baseTargets, 1, sourceId)
                }

                break
            }

            case 'atk_shoubu_time': {
                // 勝負タイム: 
                // 自分を含む全プレイヤーの中からランダム1名を選び、そのプレイヤーに+1杯
                // 将来的にはミニゲームを行い、負けたプレイヤー1名が+1杯になる仕様に変更
                if (updatedPlayers.length === 0) {
                    break
                }

                const shuffled = [...updatedPlayers].sort(() => Math.random() - 0.5)
                const loser = shuffled[0]

                if (loser) {
                    plusTo([loser.id], 1, playerId)
                }

                break
            }

            case 'atk_shoot': {
                // 狙い撃ち
                // 指定1名の1人の今ターンの杯数を再挑戦

                if (updatedDrinks.length === 0) {
                    break
                }

                const { game, settings, players } = stateBefore

                // 1) 対象プレイヤーIDを決定
                let targetId = targetPlayerId

                // targetIdが渡されなかった場合は、自分を含む全プレイヤーからランダム1人
                if (!targetId) {
                    const shuffled = [...updatedPlayers].sort(() => Math.random() - 0.5)
                    const picked = shuffled[0]
                    targetId = picked ? picked.id : undefined
                }

                if (!targetId) {
                    break
                }

                // 2) 対象プレイヤー本体を取得
                const targetPlayer = updatedPlayers.find((p) => p.id === targetId)
                if (!targetPlayer) {
                    break
                }

                // 3) 代表プレイヤー判定
                const active = players[game.activePlayerIndex] ?? null
                const activeId = active ? active.id : null

                // 4) 対象プレイヤーの杯数を再計算
                const newResult = calcDrinkForPlayer(
                    targetPlayer,
                    game.mood,
                    game.currentEvent,
                    settings.safety,
                    activeId,
                    players,
                )

                // 5) 対象プレイヤー分の DrinkResult を置き換え
                const exists = updatedDrinks.some((d) => d.playerId === targetPlayer.id)

                if (exists) {
                    updatedDrinks = updatedDrinks.map((d) =>
                        d.playerId === targetPlayer.id ? newResult: d,
                    )
                } else {
                    updatedDrinks = [...updatedDrinks, newResult]
                }
                break
            }

            case 'sp_gain_xp': {
                // 経験値ブースト：
                // 使用したプレイヤーへXP+1
                const updatedPlayers2 = updatedPlayers.map((p) => {
                    if (p.id !== playerId) return p

                    return applyXpAndLevelUp(p, 1)
                })

                updatedPlayers = updatedPlayers2

                break
            }

            case 'atk_field_break': {
                // フィールドブレイク
                // このターン中、全員のセーフガード効果を無効化する
                fieldBreakActiveThisTurn = true
                break
            }

            default:
                // それ以外のカードは今のところ「効果なし」で消費だけ行う
                break
        }

        // セーフティ設定を取得
        const safety = stateBefore.settings.safety

        // 最終杯数をプレイヤーごとの最大杯数+セーフティでクランプ
        const clampedDrinks = updatedDrinks.map((d) => {
            const p = updatedPlayers.find((player) => player.id === d.playerId)
            if (!p) return d
            return {
                ...d,
                final: clampFinalWithAllCaps(d.final, p, safety),
            }
        })

        // lastUseCardの更新
        const updatedGame = {
            ...stateBefore.game,
            currentDrinks: clampedDrinks,
            lastUsedCard: {
                playerId,
                cardId,
                usedAtTurn: stateBefore.game.turn,
            },
        }

        // 今ターンのスルーガード状態を保存
        slueGuardedThisTurn = Array.from(guardedIds)

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

    // 強制パッシブ付与（デバッグ用）
    debugGrantPassive: (playerId, passiveId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (!player) return
        
        // すでに持っていれば何もしない（重複防止）
        if (player.passives.includes(passiveId)) {
            return
        }

        const updatedPlayers = state.players.map((p) =>
            p.id === playerId
                ? {
                    ...p,
                    passives: [...p.passives, passiveId],
                }
                : p,
        )

        set({ players: updatedPlayers })
    },

}))

