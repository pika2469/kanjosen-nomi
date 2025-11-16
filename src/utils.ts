import { STATION_ORDER } from '@/stations'
import type { StationId, Direction } from '@/types/game'

// 現在の駅 currentから、方向 direction に steps 駅進んだ先を返す
// allowDuplicate = false の場合は、その方向に進みながら未訪問駅を優先
// それでも全駅訪問済なら重複を許可して baseIdx の駅を返す
export function getNextStationId(
    current: StationId | null,
    steps: number,
    direction: Direction,   // 'cw' | 'ccw'
    allowDuplicate: boolean,
    visited: StationId[],   // 訪問駅：gameStore.tsで追加
): StationId {
    const order = STATION_ORDER
    const len = order.length
    
    // current が null の場合は「大阪」からスタート
    const startIdx = current ? order.indexOf(current) : 0
    const safeStart = startIdx >= 0 ? startIdx : 0

    // 進行方向に応じてインデックスを計算
    const offset = steps % len || 0

    const baseIdx = 
        direction === 'cw' 
        ? (safeStart + offset + len) % len
        : (safeStart - offset + len) % len 

    if (allowDuplicate) {
        return order[baseIdx]
    }

    // 重複禁止：baseIdx以降（進行方向側）で未訪問駅を探す
    for (let i = 0; i < len; i++) {
        const idx =
            direction === 'cw' 
            ? (baseIdx + i) % len
            : (baseIdx - i + len) % len
        const id = order[idx]
        if (!visited.includes(id)) {
            return id
        }
    }

    // すべて訪問済なら、重複を許可して baseIdx を使用
    return order[baseIdx]   
}