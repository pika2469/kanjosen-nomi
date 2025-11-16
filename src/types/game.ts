// カテゴリの一覧を型として固定する
// 利点：誤字をコンパイル時に検出できる

// 飲みスタイル
export type PlayerStyle = 'attack' | 'moderate' | 'trick'

// カード系統
export type CardKind = 'attack' | 'safe' | 'special'

// ムードルーレット（テンションMAX, まったり, 攻め, 守り, 幸運, k均衡）
export type Mood = 'max' | 'calm' | 'aggressive' | 'defensive' | 'lucky' | 'balance'

// 駅の進む方向
export type Direction = 'cw' | 'ccw'

// フェーズ
export type Phase =
    | 'roulette'    // 1. ムードルーレット
    | 'station'     // 2. 駅決定
    | 'event'       // 3. 駅イベント
    | 'draw'        // 4. カードドロー
    | 'roll'        // 5. 杯数抽選
    | 'action'      // 6. カード使用
    | 'progress'    // 7. 成長判定
    | 'result'      // 8. 結果まとめ

// アプリ動作のグローバル設定
export interface Settings {
    allowDuplicateStations: boolean // 駅重複のON/OFF
    sound: boolean     // 効果音ON/OFF
    safety: boolean    // 安全モードON/OFF、ONなら飲みすぎ抑制
}

// パッシブID（攻撃/防御/特殊 x 各3段階)
export type PassiveId =
    | 'attack_t1'
    | 'attack_t2'
    | 'attack_t3'
    | 'safe_t1'
    | 'safe_t2'
    | 'safe_t3'
    | 'trick_t1'
    | 'trick_t2'
    | 'trick_t3'

// 駅ID（19駅)
export type StationId =
    | 'osaka'
    | 'fukushima'
    | 'noda'
    | 'nishi_kujo'
    | 'bentencho'
    | 'taisho'
    | 'ashiharabashi'
    | 'imamiya'
    | 'shin_imamiya'
    | 'tennoji'
    | 'teradacho'
    | 'momodani'
    | 'tsuruhashi'
    | 'tamatsukuri'
    | 'morinomiya'
    | 'osakajo_koen'
    | 'kyobashi'
    | 'sakuranomiya'
    | 'temma'

// プレイヤーの属性
export interface Player {
    id: string
    name: string
    style: PlayerStyle
    level: number
    xp: number      // 経験値
    sp: number      // スキルポイント
    Li: number      // 下限杯数、デフォルトは1杯（最終杯数はLiを下回らない）
    handSizeMax : number    // 手札上限、2~3枚の範囲で変動
    passives: PassiveId[]   // 取得済みパッシブID
}

// 最新の進行状況
export interface GameStateSlice {
    phase: Phase
    turn: number
    mood: Mood | null   // 未確定の間はnull
    activePlayerIndex: number   // 代表プレイヤー
    currentStation: StationId | null
    visitedStations: StationId[]
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
    | 'minigame'
