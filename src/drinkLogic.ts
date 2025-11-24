import type { Mood, StationEvent, DrinkResult, Player } from '@/types/game'
import {
    hasSafeLighten, hasTrickRandomBoost, hasTrickDualRoll
} from '@/passives'


// ベースロールの上限（暫定で0~5杯想定)
const MAX_DRINK_BASE = 5

// 安全側の上限（セーフティON時に使う）
const MAX_DRINK_SAFETY = 2

// 0~3杯の重み付きベースロール
// function randomBaseDrink(): number {
//     const r = Math.random()

//     if (r < 0.1) {
//         return 0
//     } else if (r < 0.5) {
//         return 1
//     } else if (r < 0.9) {
//         return 2
//     } else {
//         return 3
//     }
// }

// 出現させたい値(values)と重み(weights)を渡すと、重いほど出やすいように値をランダムで1つ返す
// 例: values = [0,1,2,3], weights=[1,4,4,1]なら1と2が出やすい
function pickWeighted(values: number[], weights: number[]): number {
    const total = weights.reduce((s, w) => s + w, 0) // weightsの要素の合計
    const r = Math.random() * total
    let acc = 0
    for (let i = 0; i < values.length; i++) {
        acc += weights[i]
        if (r <= acc) return values[i]
    }
    return values[values.length - 1] // 最後まで引っかからなかった場合の保険
}

// パッシブを考慮したベース杯数ロール
function rollBaseWithPassives(player: Player): number {
    const hasSafe = hasSafeLighten(player)
    const hasTrick = hasTrickRandomBoost(player)

    // デフォルト: 0~3の中で1~2が出やすい分布
    let weights: number[] = [1, 4, 4, 1]

    if (hasSafe && !hasTrick) {
        // 防御1段階：軽減補正
        // 0,1杯が少し増え、2,3杯が少し減る
        weights = [2, 5, 3, 1]

    } else if (!hasSafe && hasTrick) {
        // 特殊1段階: ランダム補正
        // 現状は重み付けのプラス補正のみ。後でバランスは要検討
        weights = [1, 3, 5, 2]

    } else if (!hasSafe && hasTrick) {
        // 防御1段階と特殊1段階でパッシブが相反する場合、中央寄りに戻す
        weights = [1, 4, 4, 1]
    }

    // 抽選で排出される杯数
    const values = [0, 1, 2, 3]
    
    // ベース杯数ロール決定
    let base = pickWeighted(values, weights)

    // 特殊3段階目: もう1回ロールして良い方を採用
    // 現在は「良い方」=「数字が大きい方」としているが、後々ユーザーが結果を選択できるように変更
    if (hasTrickDualRoll(player)) {
        const second = pickWeighted(values, weights)
        base = Math.max(base, second)
    }

    return base
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

    // const base = randomBaseDrink()
    const base = rollBaseWithPassives(player)

    const moodMod = getMoodModifier(mood)
    const eventMod = getEventModifier(event, player.id, activePlayerId)
    const passiveMod = getPassiveModifier(player)

    const rawTotal = base + moodMod + eventMod + passiveMod

    // 上限はセーフティONの場合少し低めにする
    const maxCap = safety ? MAX_DRINK_SAFETY : MAX_DRINK_BASE
    
    const final = clamp(rawTotal, player.Li, maxCap)


    return {
        playerId: player.id,
        final,
        base,
        moodMod,
        eventMod,
        passiveMod,        
    }
}