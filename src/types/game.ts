// カテゴリの一覧を型として固定する
// 利点：誤字をコンパイル時に検出できる

// 飲みスタイル
export type PlayerStyle = 'attack' | 'moderate' | 'trick'
// カード系統
export type CardKind = 'attack' | 'defense' | 'special'
// 運命ルーレット（テンションMAX, まったり, 攻め, 守り, 幸運, k均衡）
export type Mood = 'max' | 'calm' | 'aggressive' | 'defensive' | 'lucky' | 'balance'

// フェーズ
export type Phase =
    | 'roulette'    // 1. 運命ルーレット
    | 'station'     // 2. 駅決定
    | 'event'       // 3. 駅イベント
    | 'draw'        // 4. カードドロー
    | 'roll'        // 5. 杯数抽選
    | 'action'      // 6. カード/スキル使用
    | 'progress'    // 7. 成長判定
    | 'result'      // 8. 結果まとめ

// アプリ動作のグローバル設定
export interface Settings {
    allowDuplicateStations: boolean // 駅重複のON/OFF
    sound: boolean     // 効果音ON/OFF
    safety: boolean    // 安全モードON/OFF、ONなら飲みすぎ抑制
}

// プレイヤーの属性
export interface Player {
    id: string
    name: string
    style: PlayerStyle
    level: number
    xp: number     // 経験値
    Li: number      // 下限杯数、デフォルトは1杯（最終杯数はLiを下回らない）
    handSizeMax : number    // 手札上限、2~3枚の範囲で変動
}

// 最新の進行状況
export interface GameStateSlice {
    phase: Phase
    turn: number
    mood: Mood | null   // 未確定の間はnull
    activePlayerIndex: number   // 代表プレイヤー
}

// IndexedDBに永続保存する対象データ。復元にも使用
export interface PersistedData {
    settings: Settings
    players: Player[]
}

// ページ種別（ページ切替に使用）
export type Page =
    | 'home'
    | 'turn'
    | 'roulette'
    | 'cardHand'
    | 'result'
    | 'settings'
