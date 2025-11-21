import type { Card, CardId } from '@/types/game'

// 仮でカード定義。効果ロジックは後で実装
export const CARDS: Card[] = [
    {
        id: 'atk_plus1_single',
        kind: 'attack',
        name: '+1券(指名)',
        description: '任意の1人に+1杯',
    },
    {
        id: 'atk_plus1_all',
        kind: 'attack',
        name: '+1券(全体)',
        description: '全員+1杯',
    },
    {
        id: 'safe_minus1_self',
        kind: 'safe',
        name: '軽減券',
        description: '自分の杯数-1杯',
    },
    {
        id: 'safe_noalcohol',
        kind: 'safe',
        name: 'ノンアル券',
        description: 'このターンは実質0杯',
    },
    {
        id: 'sp_reroll_mood',
        kind: 'special',
        name: 'ムード再抽選',
        description: 'ムードルーレットを引き直す',
    },
    {
        id: 'sp_reroll_drink',
        kind: 'special',
        name: '杯数最抽選',
        description: '自分の杯数を振り直せる',
    },
]

// CardIdを元にCardデータを取得する関数
export function getCardById(id: CardId | null | undefined): Card | null {
    if (!id) return null
    return CARDS.find((c) => c.id === id) ?? null
}

// カードをランダムに1枚ドローする関数（IDだけ返す）
export function drawRandomCardId(): CardId {
    const idx = Math.floor(Math.random() * CARDS.length)
    return CARDS[idx].id
}