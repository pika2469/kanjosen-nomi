import type { Mood, StationEvent, DrinkResult, Player } from '@/types/game'

// ベースロールの上限（暫定で0~4杯想定)
const MAX_DRINK_BASE = 4

// 安全側の上限（セーフティON時に使う）
const MAX_DRINK_SAFETY = 2

// 0~maxのランダム整数を生成する関数
function randomInt(max: number): number {
    return Math.floor(Math.random() * (max+1))
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

// 駅イベントによる補正（今は仮で0）
function getEventModifier(_event: StationEvent | null): number {
    // TODO: app_spec_v1.2の具体イベントに応じて補正値を変える
    return 0
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
): DrinkResult {

    const base = randomInt(3)

    const moodMod = getMoodModifier(mood)
    const eventMod = getEventModifier(event)
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