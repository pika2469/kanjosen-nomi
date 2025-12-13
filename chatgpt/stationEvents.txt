import type { StationEvent, StationAttr, StationId } from '@/types/game'
import { STATIONS } from '@/stations'

// 属性別のイベント定義
// type EventDef = {
//     id: string
//     title: string
//     description: string
// }

// 以下のイベントは仮の内容
// const 繁華街Events: EventDef[] = [
//     {
//         id: 'crowded_bonus',
//         title: '繁華街ボーナス',
//         description: '人の多さでテンションup! このターンは全員ちょっと攻め気味になる予定',
//     },
//     {
//         id: 'shop_hopping',
//         title: 'はしご酒チャンス',
//         description: '店が多すぎて選べない！思わず2軒目へ行っちゃうかも？',
//     },
// ]

// const 水辺Events: EventDef[] = [
//     {
//         id: 'relax_view',
//         title: 'ちょっと一息',
//         description: '水辺の街でクールダウン。このターンは少し落ち着いたムードになりそう。',
//     },
//     {
//         id: 'river_walk',
//         title: '川沿いぶらり',
//         description: 'コンビニでお酒を買って散歩しながら飲んでみよう！',
//     },
// ]

// const 下町Events: EventDef[] = [
//     {
//         id: 'local_talk',
//         title: '常連さんトーク',
//         description: '地元の人と盛り上がる！話題が増えて乾杯回数も増えそうな雰囲気',
//     },
//     {
//         id: 'cheap_yet_good',
//         title: '安くてうまい',
//         description: 'コスパ最強の店を発見。おかわりするしかない！',
//     },
// ]

// const 乗換Events: EventDef[] = [
//     {
//         id: 'route_confusion',
//         title: 'ルート会議',
//         description: '次にどこに行こうか？作戦タイムでついついお酒が進む',
//     },
//     {
//         id: 'people_flow',
//         title: '人の流れに乗る',
//         description: '乗換客の流れに乗って、駅の近くの居酒屋へ勢いで吸い込まれそう',
//     },
// ]

// 属性ごとにイベント配列にまとめる
// const EVENTS_BY_ATTR: Record<StationAttr, EventDef[]> = {
//     繁華街: 繁華街Events,
//     水辺: 水辺Events,
//     下町: 下町Events,
//     乗換: 乗換Events,
// }

// 駅IDから属性を取得
function getStationAttr(stationId: StationId) : StationAttr | null {
    const station = STATIONS.find((s) => s.id === stationId)
    return station ? (station.attr as StationAttr) : null
}

// 0~1未満の乱数を返す
function rand(): number {
    return Math.random()
}

// 駅属性ごとの2種類のイベント(A/B)を確率で決める
export function pickStationEvent(stationId: StationId): StationEvent | null {
    // 駅IDから駅属性を取得（例: '繁華街')
    const attr = getStationAttr(stationId)
    if (!attr) return null

    const r = rand()    // 乱数発生

    if (attr === '繁華街') {
        // A: 全員+1 + 代表さらに+1
        if (r < 0.7) {
            return {
                id: 'downtown_rep_plus2_others_plus1',
                stationId,
                attr,
                title:'繁華街ボーナス(代表特盛)',
                description: '全員+1杯に加え、代表はさらに+1杯！',
                cardEffect: 'none',
            }
        } else {
            // B: 全員+1
            return {
                id: 'downtown_all_plus1',
                stationId,
                attr,
                title: '繁華街ボーナス',
                description: '全員+1杯!',
                cardEffect: 'none',
            }
        }
    }

    if (attr === '水辺') {
        // A: 代表以外の全員-1杯
        if (r < 0.3) {
            return {
                id: 'waterside_others_minus1',
                stationId,
                attr,
                title: 'クールダウン(周囲)',
                description: '代表以外の全員-1杯',
                cardEffect: 'none',
            } 
        } else {
            // B: 代表のみ-1杯
            return {
                id: 'waterside_rep_minus1',
                stationId,
                attr,
                title: 'クールダウン(代表)',
                description: '代表だけ-1杯',
                cardEffect: 'none',
            }
        }
    }
    
    if (attr === '下町') {
        // A: 全員+1杯
        if (r < 0.3) {
            return {
                id: 'shitamachi_all_plus1',
                stationId,
                attr,
                title: '下町ノリで乾杯',
                description: '全員+1杯!一斉に乾杯!',
                cardEffect: 'none',
            } 
        } else {
            // B: 代表のみ+1杯
            return {
                id: 'shitamachi_rep_plus1',
                stationId,
                attr,
                title: '下町代表サービス',
                description: '代表だけ+1杯',
                cardEffect: 'none',
            }
        }
    }

    if (attr === '乗換') {
        // A: 代表カードドロー+1枚
        if (r < 0.7) {
            return {
                id: 'transfer_rep_draw_plus1',
                stationId,
                attr,
                title: '乗換チャンス',
                description: '代表はカードドロー+1枚',
                cardEffect: 'rep_draw_plus1',
            } 
        } else {
            // B: 代表はこのターンカード使用不可
            return {
                id: 'transfer_rep_skip_action',
                stationId,
                attr,
                title: '乗換トラブル',
                description: '代表はこのターンカード使用不可',
                cardEffect: 'rep_skip_action',
            }
        }
    }

    // const candidates = EVENTS_BY_ATTR[attr]
    // if (!candidates || candidates.length === 0) return null

    // const idx = Math.floor(Math.random() * candidates.length)
    // const def = candidates[idx]

    // return {
    //     id: def.id,
    //     title: def.title,
    //     description: def.description,
    //     stationId,
    // }

    return null
}