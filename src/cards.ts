import type { Card, CardId, CardKind, CardRarity, Player } from '@/types/game'
import {
    hasAttackRateUp,
    hasSafeRateUp,
    hasTrickRateUp,
    hasTrickChaos,
} from '@/passives'


// カード一覧（とりあえず主要カードのみ）
export const CARDS: Card[] = [
    // アタック系
    {
        id: 'atk_hitokuchi_plus',
        kind: 'attack',
        rarity: 'N',
        name: 'ひとくちプラス',
        description: '自分以外のランダム1人に+1杯',
    },
    {
        id: 'atk_michizure_plus',
        kind: 'attack',
        rarity: 'N',
        name: '道連れプラス',
        description: '自分とランダム1人が+1杯',
    },
    {
        id: 'atk_minna_de_kanpai',
        kind: 'attack',
        rarity: 'R',
        name: 'みんなで乾杯',
        description: '全員が+1杯',
    },
    {
        id: 'atk_shoot',
        kind: 'attack',
        rarity: 'R',
        name: '狙い撃ち',
        description: '指定1名は今ターン杯数を再抽選(ロジックは未実装)',
    },
    {
        id: 'atk_field_break',
        kind: 'attack',
        rarity: 'SR',
        name: 'フィールドブレイク',
        description: '今ターン全員のセーフカード効果を無効化(ロジックは未実装)',
    },
    // セーフ系
    {
        id: 'safe_non_alcohol',
        kind: 'safe',
        rarity: 'SR',
        name: 'ノンアル券',
        description: 'このターン杯数0固定',
    },
    {
        id: 'safe_hitoyasumi',
        kind: 'safe',
        rarity: 'N',
        name: 'ひとやすみ',
        description: '自分の杯数を-1杯',
    },
    {
        id: 'safe_karume',
        kind: 'safe',
        rarity: 'R',
        name: '軽めにいくわ',
        description: '自分-2杯,次ターン杯数抽選上昇(ロジックは未実装)',
    },
    {
        id: 'safe_slue_guard',
        kind: 'safe',
        rarity: 'R',
        name: 'スルーガード',
        description: '加算を自分だけ無効化(ロジックは未実装)',
    },
    {
        id: 'safe_yukkuri_mode',
        kind: 'safe',
        rarity: 'R',
        name: 'ゆっくりモード',
        description: '杯数抽選が下限寄りになる(ロジックは未実装)',
    },
    // スペシャル系
    {
        id: 'sp_reroll',
        kind: 'special',
        rarity: 'N',
        name: 'リロール',
        description: '自分の杯数を再抽選',
    },
    {
        id: 'sp_draw_plus1',
        kind: 'special',
        rarity: 'N',
        name: 'ドロー+1',
        description: '次ターンのカードドロー+1枚(ロジックは未実装)',
    },
    {
        id: 'sp_mood_break',
        kind: 'special',
        rarity: 'R',
        name: 'ムードブレイク',
        description: '駅イベント補正を無効化(ロジックは未実装)',
    },
    {
        id: 'sp_random_change',
        kind: 'special',
        rarity: 'N',
        name: 'ランダムチェンジ',
        description: 'ランダム2名の杯数を入れ替える(ロジックは未実装)',
    },
    {
        id: 'sp_reverse',
        kind: 'attack',
        rarity: 'SR',
        name: 'リバース',
        description: '全員の最終杯数を反転(1⇔5, 2⇔4, 3⇔3)',
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