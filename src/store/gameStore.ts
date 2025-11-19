import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Player, Settings, GameStateSlice, Phase, Mood, Page, Direction, DrinkResult } from '../types/game'
import { loadPlayers, loadSettings, saveSettings, upsertPlayer, removePlayer, replacePlayers, resetAll } from '../lib/db'
import { MOODS } from '@/constants/mood'
import { getNextStationId } from '@/utils'
import { pickStationEvent } from '@/stationEvents'
import { calcDrinkForPlayer } from '@/drinkLogic'

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
        set((state) => ({
            game: {
                ...state.game,
                currentStation: nextId,
                visitedStations: state.game.visitedStations.includes(nextId) 
                ? state.game.visitedStations
                : [...state.game.visitedStations, nextId],
                currentEvent: event,
            },
        }))
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

}))

