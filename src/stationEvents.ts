import type { StationEvent, StationId } from '@/types/game'
import { STATIONS } from '@/stations'

type StationAttr = '繁華街' | '水辺' | '下町' | '乗換'

// 属性別のイベント定義
type EventDef = {
    id: string
    title: string
    description: string
}

// 以下のイベントは仮の内容
const 繁華街Events: EventDef[] = [
    {
        id: 'crowded_bonus',
        title: '繁華街ボーナス',
        description: '人の多さでテンションup! このターンは全員ちょっと攻め気味になる予定',
    },
    {
        id: 'shop_hopping',
        title: 'はしご酒チャンス',
        description: '店が多すぎて選べない！思わず2軒目へ行っちゃうかも？',
    },
]

const 水辺Events: EventDef[] = [
    {
        id: 'relax_view',
        title: 'ちょっと一息',
        description: '水辺の街でクールダウン。このターンは少し落ち着いたムードになりそう。',
    },
    {
        id: 'river_walk',
        title: '川沿いぶらり',
        description: 'コンビニでお酒を買って散歩しながら飲んでみよう！',
    },
]

const 下町Events: EventDef[] = [
    {
        id: 'local_talk',
        title: '常連さんトーク',
        description: '地元の人と盛り上がる！話題が増えて乾杯回数も増えそうな雰囲気',
    },
    {
        id: 'cheap_yet_good',
        title: '安くてうまい',
        description: 'コスパ最強の店を発見。おかわりするしかない！',
    },
]

const 乗換Events: EventDef[] = [
    {
        id: 'route_confusion',
        title: 'ルート会議',
        description: '次にどこに行こうか？作戦タイムでついついお酒が進む',
    },
    {
        id: 'people_flow',
        title: '人の流れに乗る',
        description: '乗換客の流れに乗って、駅の近くの居酒屋へ勢いで吸い込まれそう',
    },
]

// 属性ごとにイベント配列にまとめる
const EVENTS_BY_ATTR: Record<StationAttr, EventDef[]> = {
    繁華街: 繁華街Events,
    水辺: 水辺Events,
    下町: 下町Events,
    乗換: 乗換Events,
}

// 駅IDから属性を取得
function getStationAttr(stationId: StationId) : StationAttr | null {
    const station = STATIONS.find((s) => s.id === stationId)
    return station ? (station.attr as StationAttr) : null
}

// 駅IDから、その駅の属性に応じた駅イベントを1つランダムに選ぶ
// 該当がなければnullを返す
export function pickStationEvent(stationId: StationId): StationEvent | null {
    const attr = getStationAttr(stationId)
    if (!attr) return null

    const candidates = EVENTS_BY_ATTR[attr]
    if (!candidates || candidates.length === 0) return null

    const idx = Math.floor(Math.random() * candidates.length)
    const def = candidates[idx]

    return {
        id: def.id,
        title: def.title,
        description: def.description,
        stationId,
    }
}