import type { Mood, StationEvent, DrinkResult, Player } from '@/types/game'

// ベースロールの上限（暫定で0~5杯想定)
const MAX_DRINK_BASE = 5

// 安全側の上限（セーフティON時に使う）
const MAX_DRINK_SAFETY = 2

// 0~3杯の重み付きベースロール
function randomBaseDrink(): number {
    const r = Math.random()

    if (r < 0.1) {
        return 0
    } else if (r < 0.5) {
        return 1
    } else if (r < 0.9) {
        return 2
    } else {
        return 3
    }
}

// ムードによる補正（仮実装）
function getMoodModifier(mood: Mood | null): number {
    if (!mood) return 0

    switch (mood) {
        case 'max':
        case 'aggressive':
            return 1    // 攻めムード → +1の方向
        case 'calm':
        case 'defensive':
            return -1   // まったり/守り → -1の方向
        case 'lucky':
        case 'balance':
        default:
            return 0
    }
}

// 駅イベントによる補正
function getEventModifier(
    event: StationEvent | null,
    playerId: string,
    activePlayerId: string | null,
): number {
    if (!event || !activePlayerId) return 0

    const isRep = playerId === activePlayerId

    switch (event.id) {
        
        // '繁華街'
        case 'downtown_rep_plus2_others_plus1':
            // 全員+1 + 代表さらに+1
            return isRep ? 2 : 1
        case 'downtown_all_plus1':
            // 全員+1
            return 1
        
        // '水辺'
        case 'waterside_others_minus1':
            // 代表以外の全員-1
            return isRep ? 0 : -1
        case 'waterside_rep_minus1':
            // 代表のみ-1
            return isRep ? -1 : 0

        // '下町'
        case 'shitamachi_all_plus1':
            // 全員+1
            return 1
        case 'shitamachi_rep_plus1':
            // 代表のみ+1
            return isRep ? 1 : 0

        // '乗換'
        case 'transfer_rep_draw_plus1':
        case 'transfer_rep_skip_action':
            return 0

        default:
            return 0
    }
}

// パッシブによる補正（今は仮で0)
function getPassiveModifier(_player: Player): number {
    // TODO: パッシブツリー仕様を固めてから、ここで個別補正
    return 0
}

// 安全なclamp
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

// 1プレイヤー分の杯数を計算する関数
// - ベースロール：0~3杯程度（仮）
// - ムード・イベント・パッシブの補正を合計
// - 下限Li・上限(セーフティ)でclamp

export function calcDrinkForPlayer(
    player: Player,
    mood: Mood | null,
    event: StationEvent | null,
    safety: boolean,
    activePlayerId: string | null,
): DrinkResult {

    const base = randomBaseDrink()

    const moodMod = getMoodModifier(mood)
    const eventMod = getEventModifier(event, player.id, activePlayerId)
    const passiveMod = getPassiveModifier(player)

    const rawTotal = base + moodMod + eventMod + passiveMod

    // 上限はセーフティONの場合少し低めにする
    const maxCap = safety ? MAX_DRINK_SAFETY : MAX_DRINK_BASE
    
    const total = clamp(rawTotal, player.Li, maxCap)


    return {
        playerId: player.id,
        total,
        base,
        moodMod,
        eventMod,
        passiveMod,        
    }
}