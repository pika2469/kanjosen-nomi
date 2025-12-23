import type { Mood } from '@/types/game'

export type MoodInfo = {
    id: Mood
    label: string
    icon: string
    description: string
}

export const MOODS: MoodInfo[] = [
    {
        id: 'max',
        icon: '🌞',
        label: 'テンション+',
        description: '全員の最終杯数が+1杯されます'
    },
    {
        id: 'calm',
        icon: '🌙',
        label: 'ちょっと休憩',
        description: '全員の最終杯数が-1杯されます'
    },
    {
        id: 'aggressive',
        icon: '🔥',
        label: 'アタックモード',
        description: 'このターンのドローでアタックカード出現率+15%'
    },
    {
        id: 'defensive',
        icon: '💧',
        label: 'セーフモード',
        description: 'このターンのドローでセーフカード出現率+15%'
    },
    {
        id: 'lucky',
        icon: '💫',
        label: 'ハッピードロー',
        description: 'このターンのドローでレア以上(R/SR)出現率+15%'
    },
    {
        id: 'balance',
        icon: '🌞',
        label: 'ブーストモード',
        description: 'このターンの代表プレイヤーのドロー1枚が必ずR/SRになる'
    },
]

// ムードIDから情報を取得するヘルパ
export function getMoodInfo(id: Mood | null): MoodInfo | null {
    if (!id) return null
    return MOODS.find((m) => m.id === id) ?? null
}