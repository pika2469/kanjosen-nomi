import type { Card, CardId, Player } from '@/types/game'
import {
    hasAttackRateUp,
    hasSafeRateUp,
    hasTrickRateUp,
} from '@/passives'


// 仮でカード定義。効果ロジックは後で実装
export const CARDS: Card[] = [
    {
        id: 'atk_plus1_single',
        kind: 'attack',
        rarity: 'N',
        name: '+1券(指名)',
        description: '任意の1人に+1杯',
    },
    {
        id: 'atk_plus1_all',
        kind: 'attack',
        rarity: 'R',
        name: '+1券(全体)',
        description: '全員+1杯',
    },
    {
        id: 'safe_minus1_self',
        kind: 'safe',
        rarity: 'N',
        name: '軽減券',
        description: '自分の杯数-1杯',
    },
    {
        id: 'safe_noalcohol',
        kind: 'safe',
        rarity: 'SR',
        name: 'ノンアル券',
        description: 'このターンは実質0杯',
    },
    {
        id: 'sp_reroll_mood',
        kind: 'special',
        rarity: 'R',
        name: 'ムード再抽選',
        description: 'ムードルーレットを引き直す',
    },
    {
        id: 'sp_reroll_drink',
        kind: 'special',
        rarity: 'N',
        name: '杯数最抽選',
        description: '自分の杯数を振り直せる',
    },
]

// CardIdを元にCardデータを取得する関数
export function getCardById(id: CardId | null | undefined): Card | null {
    if (!id) return null
    return CARDS.find((c) => c.id === id) ?? null
}

// レアリティごとの基本重み
function rarityWeight(rarity: Card['rarity']): number {
    switch (rarity) {
        case 'N':
            return 1
        case 'R':
            return 0.5
        case 'SR':
            return 0.2
        default:
            return 1
    }
}

// 重みを考慮して値を1つ返す
// weightsは各カードの出現重み、例えばweights = [1, 0.5, 0.2, 1.2, 1]
function pickWeightedIndex(weights: number[]): number {
    const total = weights.reduce((s, w) => s + w, 0)
    const r = Math.random() * total
    let acc = 0
    for (let i = 0; i < weights.length; i++) {
        acc += weights[i]
        if (r <= acc) return i
    }
    return weights.length -1
}


// カードをランダムに1枚ドローする関数（IDだけ返す）
// export function drawRandomCardId(): CardId {
//     const idx = Math.floor(Math.random() * CARDS.length)
//     return CARDS[idx].id
// }

export function drawRandomCardId(player?: Player): CardId {
    // 系統ごと基本重み
    let wAttack = 1
    let wSafe = 1
    let wSpecial = 1

    if (player) {
        if (hasAttackRateUp(player)) wAttack += 0.2 // +20%
        if (hasSafeRateUp(player)) wSafe += 0.2
        if (hasTrickRateUp(player)) wSpecial += 0.2
    }

    const weights = CARDS.map((card) => {
        const kindWeight =
            card.kind === 'attack'
                ? wAttack
                : card.kind === 'safe'
                ? wSafe
                : wSpecial
        return kindWeight * rarityWeight(card.rarity)
    })

    const index = pickWeightedIndex(weights)
    return CARDS[index].id    
}