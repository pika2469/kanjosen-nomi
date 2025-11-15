import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Player, Settings, GameStateSlice, Phase, Mood, Page } from '../types/game'
import { loadPlayers, loadSettings, saveSettings, upsertPlayer, removePlayer, replacePlayers, resetAll } from '../lib/db'

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
            Li: 1,
            handSizeMax: 2,
        }
        set({ players: [...get().players, p] })
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
    }

}))

