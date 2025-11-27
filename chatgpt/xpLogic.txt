import type { Player } from '@/types/game'

// レベルごとの”累積XP閾値”
const LEVEL_XP_THRESHOLDS: number[] = [
    0,  // 0 (未使用)
    0,  // Lv1
    3, // Lv2 到達に必要な累積XP
    7, // Lv3
    12, // Lv4
    18, // Lv5
]

// レベル上限
const MAX_LEVEL = 5

// プレイヤーごとにgainedXpを加算
// 必要に応じてLvを上げ、LvアップごとにSPを+1する
// 戻り値: 更新済 Player
export function applyXpAndLevelUp(player: Player, gainedXp: number): Player {
    if (gainedXp <= 0) {
        return player
    }

    let xp = player.xp + gainedXp
    let level = player.level
    let sp = player.sp

    // 現在レベルから順に、閾値を満たしていればレベルアップ
    while (level < MAX_LEVEL) {
        const  nextLevel = level + 1
        const threshold = LEVEL_XP_THRESHOLDS[nextLevel] ?? Infinity

        if (xp >= threshold) {
            level = nextLevel
            sp += 1
        } else {
            break
        }
    }

    return {
        ...player,
        xp,
        level,
        sp,
    }
}

// 1ターン分の杯数結果から、XP獲得量を計算するヘルパー
// 現状は仮で「そのターンのtotal杯数 = XP」とする
export function calcTurnXpFromDrinks(totalDrinks: number): number {
    return totalDrinks
}