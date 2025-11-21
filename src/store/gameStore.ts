import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Player, Settings, GameStateSlice, Phase, Mood, Page, Direction, DrinkResult, PlayerStyle, CardId } from '../types/game'
import { loadPlayers, loadSettings, saveSettings, upsertPlayer, removePlayer, replacePlayers, resetAll } from '../lib/db'
import { MOODS } from '@/constants/mood'
import { getNextStationId } from '@/utils'
import { pickStationEvent } from '@/stationEvents'
import { calcDrinkForPlayer } from '@/drinkLogic'
import { applyXpAndLevelUp, calcTurnXpFromDrinks } from '@/xpLogic'
import { drawRandomCardId } from '@/cards'

// Store型の定義
type Store = {
    
    //  -------- グローバル変数 --------
    // 接続データ
    settings: Settings
    players: Player[]

    // 進行データ
    game: GameStateSlice

    // ページ情報
    ui: {
        currentPage: Page
    }

    // --------- 関数 -----------------
    // 初期化/復元 : 起動時にDBから設定・プレイヤーを読み込み、ストアに反映
    bootstrap: () => Promise<void>

    // 設定：設定の一部を更新し、ストア&DBの両方に反映
    setSettings: (patch: Partial<Settings>) => Promise<void>

    // プレイヤー
    addPlayer: (name: string, style: Player['style']) => Promise<void>
    deletePlayer: (id: string) => Promise<void>
    setPlayerLi : (id: string, Li: number) => Promise<void>

    // 進行
    setMood: (mood: Mood | null) => void
    setPhase: (phase: Phase) => void
    nextTurn: () => void

    // データ削除
    resetAllData: () => Promise<void>

    // ページセット
    setPage: (page: Page) => void

    // ルーレット関連
    spinMood: () => void
    clearMood: () => void

    // 駅ロジック
    moveStation: (steps: number, direction: Direction) => void

    // 駅決定+駅イベント決定をまとめて行う(stationフェーズ用)
    runStationPhase: (steps: number, direction: Direction) => void

    // 杯数抽選ロジック(roll フェーズ用)
    runRollPhase: () => void

    // 成長判定
    runProgressPhase: () => void

    // カード系アクション
    drawCard: (playerId: string) => void
    drawToAll: () => void
    clearHands: () => void
    useCard: (playerId: string, cardId: CardId) => void
}

// Zustandストア本体
export const useGameStore = create<Store>((set, get) => ({
    
    // settings初期値
    settings: {
        allowDuplicateStations: true,
        sound: true,
        safety: true,
    },
    players: [],
    game: {
        phase: 'roulette',
        turn: 1,
        mood: null,
        activePlayerIndex: 0,
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

    setMood: (mood) => set({ game: { ...get().game, mood } }),
    setPhase: (phase) => set({ game: { ...get().game, phase } }),

    // ターン遷移 + 代表プレイヤー交代
    nextTurn: () => {
        const g = get().game
        const nextIdx = (g.activePlayerIndex + 1) % Math.max(1, get().players.length || 1)
        set({
            game: {
                ...g,
                turn: g.turn + 1,
                phase: 'roulette',
                mood: null,
                activePlayerIndex: nextIdx,
                currentDrinks: [],
                currentEvent: null,
                lastUsedCard: null,
                cardUsageBlockedForPlayerId: null,
            },
        })
    },

    // データ初期化
    resetAllData: async () => {
        const { bootstrap } = get()
        await resetAll()    // IndexedDBの全削除
        await bootstrap()   // 初期値の再読み込み
    },

    // ページ切替
    setPage: (page) => {
        set((state) => ({
            ui: { ...state.ui, currentPage: page }
        }))
    },

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
            ),
        )

        set((state) => ({
            game: {
                ...state.game,
                currentDrinks: results,
            },
        }))
    },

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
            const gained = calcTurnXpFromDrinks(r.total)
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
                const newCardId = drawRandomCardId()
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

    useCard: (playerId, cardId) => {
        const { game } = get()

        // このターンカード使用禁止なら何もしない
        if (game.cardUsageBlockedForPlayerId === playerId) {
            return 
        }
        
        set((state) => {
            const players = state.players.map((p) => {
                if (p.id !== playerId) return p

                // 手札にこのカードがあるか確認
                const idx = p.hand.indexOf(cardId)
                if (idx === -1) {
                    return p
                }

                // 先頭の1枚だけ使用
                const newHand = [...p.hand]
                newHand.splice(idx, 1)

                return {
                    ...p,
                    hand: newHand,
                }
            })

            const updateGame = {
                ...state.game,
                lastUsedCard: {
                    playerId,
                    cardId,
                    usedAtTurn: state.game.turn,
                },
            }

            return {
                ...state,
                players,
                game: updateGame,
            }
        })
    }
}))

