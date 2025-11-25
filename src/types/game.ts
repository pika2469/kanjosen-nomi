// カテゴリの一覧を型として固定する
// 利点：誤字をコンパイル時に検出できる

// 飲みスタイル
export type PlayerStyle = 'attack' | 'moderate' | 'trick'

// ムードルーレット（テンションMAX, まったり, 攻め, 守り, 幸運, k均衡）
export type Mood = 'max' | 'calm' | 'aggressive' | 'defensive' | 'lucky' | 'balance'

// 駅の進む方向
export type Direction = 'cw' | 'ccw'

// フェーズ
export type Phase =
    | 'mood'            // フェーズ1. ムードルーレット
    | 'station'         // フェーズ2. 駅決定
    | 'stationEvent'    // フェーズ3. 駅イベント
    | 'roll'            // フェーズ4: 杯数抽選（プレイヤー単位）
    | 'draw'            // フェーズ5: カードドロー（プレイヤー単位）
    | 'useCards'        // フェーズ6: カード使用（プレイヤー単位）
    | 'progress'        // フェーズ7: 成長判定
    | 'result'          // フェーズ8: 結果表示
    | 'event'           // 3. 駅イベント(デバッグ用)
    | 'action'          // 6. カード使用（デバッグ用）

// カード系統
export type CardKind = 'attack' | 'safe' | 'special'

// カードレアリティ
export type CardRarity = 'N' | 'R' | 'SR'

// カードID
export type CardId =
    | 'atk_hitokuchi_plus'
    | 'atk_michizure_plus'
    | 'atk_minna_de_kanpai'
    | 'atk_shoot'
    | 'atk_field_break'
    | 'safe_non_alcohol'
    | 'safe_hitoyasumi'
    | 'safe_karume'
    | 'safe_slue_guard'
    | 'safe_yukkuri_mode'
    | 'sp_reroll'
    | 'sp_draw_plus1'
    | 'sp_mood_break'
    | 'sp_random_change'
    | 'sp_reverse'

// カード定義
export interface Card {
    id: CardId
    kind: CardKind
    rarity: CardRarity
    name: string
    description: string
}

// 誰がどのカードを使ったか（デバッグ用）
export interface LastUsedCard {
    playerId: string
    cardId: CardId
    usedAtTurn: number
}

// アプリ動作のグローバル設定
export interface Settings {
    allowDuplicateStations: boolean // 駅重複のON/OFF
    sound: boolean     // 効果音ON/OFF
    safety: boolean    // 安全モードON/OFF、ONなら飲みすぎ抑制
}

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


// 駅イベントID
export type StationEventId =
    | 'downtown_rep_plus2_others_plus1' // 繁華街A: 全員+1 + 代表さらに+1
    | 'downtown_all_plus1'              // 繁華街B: 全員+1
    | 'waterside_others_minus1'         // 水辺A: 代表以外-1
    | 'waterside_rep_minus1'            // 水辺B: 代表のみ-1
    | 'shitamachi_all_plus1'            // 下町A: 全員+1
    | 'shitamachi_rep_plus1'            // 下町B: 代表のみ+1
    | 'transfer_rep_draw_plus1'         // 乗換A: 代表カードドロー+1
    | 'transfer_rep_skip_action'        // 乗換B: 代表カード使用不可

export type StationAttr = '繁華街' | '水辺' | '下町' | '乗換'

export type CardEffect =
    | 'none'
    | 'rep_draw_plus1'
    | 'rep_skip_action'

// 駅イベントの状態
export interface StationEvent {
    id: StationEventId      // イベントID: どのイベントが発生したか
    stationId: StationId    // 駅ID: どの駅で発生したか
    attr: StationAttr
    title: string           // イベント名(「繁華街ボーナス」など)
    description: string     // 飲み会向けの説明テキスト
    cardEffect: CardEffect  // 今はカード効果フラグだけ。カード処理は後々実装
}

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
    hand: CardId[]  // 手札
    nextTurnExtraDraw: number   // 次のターンのカードドロー枚数を+nするためのバッファ
    nextTurnPlusBias: boolean   // 次のターンの杯数ロールを「+側寄り」にする一時フラグ
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
    | 'passives'

export type UiState = {
    currentPage: Page
}

// 各プレイヤーの杯数結果
export interface DrinkResult {
    playerId: string
    final: number       // 最終杯数
    base: number        // ベースロール
    moodMod: number     // ムード補正（後で調整）
    eventMod: number    // 駅イベント補正（後で調整）
    passiveMod: number  // パッシブ補正（後で調整）
}

// 最新の進行状況
export interface GameStateSlice {
    phase: Phase
    turn: number
    mood: Mood | null   // 未確定の間はnull

    // 代表プレイヤー
    activePlayerIndex: number

    // 今処理中のプレイヤー(フェーズ4~6でのみ有効)
    phasePlayerIndex: number | null
    
    // 駅ロジック
    currentStation: StationId | null
    visitedStations: StationId[]

    // 今ターンの駅イベント（なければnull）
    currentEvent: StationEvent | null

    // 今ターンの杯数結果（プレイヤーごと）
    currentDrinks: DrinkResult[]

    // 直前で使ったカード（デバッグ用）
    lastUsedCard: LastUsedCard | null

    // このターンにカード使用が禁止されているプレイヤーID（なければnull）
    cardUsageBlockedForPlayerId: string | null
}

// パッシブ関連 -----------------------------------------------------

// パッシブ系統（とりあえず3枝）
export type PassiveBranch = 'attack' | 'safe' | 'trick'

// パッシブID(v1.4仕様)
export type PassiveId =
    // 攻撃ツリー
    | 'atk_tease'           // 1段階目:煽り上手
    | 'atk_rate_up'         // 2段階目:アタック率up
    | 'atk_trigger'         // 3段階目:攻撃トリガー
    // 防御ツリー
    | 'safe_lighten'        // 1段階目:軽減補正
    | 'safe_rate_up'        // 2段階目:セーフ率up
    | 'safe_field_shield'   // 3段階目:フィールドシールド
    // 特殊ツリー
    | 'trick_chaos'         // 1段階目:カオスカード
    | 'trick_rate_up'       // 2段階目:特殊カード率up
    | 'trick_dual_roll'     // 3段階目:デュアルロール

    // デバッグ用（後で消す）
    | 'trick_random_boost'

// パッシブノード定義
export interface PassiveNode {
    id: PassiveId
    branch: PassiveBranch
    tier: number    // 段: 上に行くほど強い
    name: string    // 表示名
    description: string
    costSp: number  // 必要SP
    requires?: PassiveId[]    // 前提パッシブ（なければundefined)
}