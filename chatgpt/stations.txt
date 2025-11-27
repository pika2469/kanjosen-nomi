import type { StationId } from '@/types/game'

export type StationAttr = '繁華街' | '水辺' | '下町' | '乗換'

export interface Station {
    id: StationId
    name: string
    attr: StationAttr
}

export const STATIONS: Station[] = [
    { id: 'osaka',         name: '大阪',        attr: '繁華街' },
    { id: 'fukushima',     name: '福島',        attr: '水辺' },
    { id: 'noda',          name: '野田',        attr: '下町' },
    { id: 'nishi_kujo',    name: '西九条',      attr: '乗換' },
    { id: 'bentencho',     name: '弁天町',      attr: '水辺' },
    { id: 'taisho',        name: '大正',        attr: '水辺' },
    { id: 'ashiharabashi', name: '芦原橋',      attr: '下町' },
    { id: 'imamiya',       name: '今宮',        attr: '乗換' },
    { id: 'shin_imamiya',  name: '新今宮',      attr: '下町' },
    { id: 'tennoji',       name: '天王寺',      attr: '繁華街' },
    { id: 'teradacho',     name: '寺田町',      attr: '下町' },
    { id: 'momodani',      name: '桃谷',        attr: '下町' },
    { id: 'tsuruhashi',    name: '鶴橋',        attr: '乗換' },
    { id: 'tamatsukuri',   name: '玉造',        attr: '水辺' },
    { id: 'morinomiya',    name: '森ノ宮',      attr: '水辺' },
    { id: 'osakajo_koen',  name: '大阪城公園',  attr: '水辺' },
    { id: 'kyobashi',      name: '京橋',        attr: '繁華街' },
    { id: 'sakuranomiya',  name: '桜ノ宮',      attr: '水辺' },
    { id: 'temma',         name: '天満',        attr: '繁華街' },
]

// IDのみの配列（駅順）
export const STATION_ORDER: StationId[] = STATIONS.map((s) => s.id)

// id → Stationの参照用
export function findStation(id: StationId | null) {
    if (!id) return null
    return STATIONS.find((s) => s.id === id) ?? null
}