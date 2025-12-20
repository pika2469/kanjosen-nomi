import type { StationEvent, StationAttr, StationId } from '@/types/game'
import { STATIONS } from '@/stations'

// 属性別のイベント定義
export type StationEventId =
  | 'downtown_rep_plus2_others_plus1'
  | 'downtown_all_plus1'
  | 'waterside_others_minus1'
  | 'waterside_rep_minus1'
  | 'shitamachi_all_plus1'
  | 'shitamachi_rep_plus1'
  | 'transfer_rep_draw_plus1'
  | 'transfer_rep_skip_action'

export type StationEventDef = {
  id: StationEventId
  title: string
  summary: string
  detail: string
  illustrationId: string
}

export const STATION_EVENTS: Record<StationEventId, StationEventDef> = {
  downtown_rep_plus2_others_plus1: {
    id: 'downtown_rep_plus2_others_plus1',
    title: '繁華街：代表ドカ飲みタイム',
    summary: '代表+2杯、その他の全員+1杯',
    detail:
      'にぎやかな繁華街に到着。テンションが一気に上がり、代表プレイヤーは特に飲まされる展開に。',
    illustrationId: 'downtown',
  },

  downtown_all_plus1: {
    id: 'downtown_all_plus1',
    title: '繁華街：みんなで乾杯！',
    summary: '全員+1杯',
    detail:
      '人が多く活気のあるエリアに到着。全員が1杯追加で飲むことになります。',
    illustrationId: 'downtown',
  },

  waterside_others_minus1: {
    id: 'waterside_others_minus1',
    title: '水辺：まったりタイム',
    summary: '代表以外の全員-1杯',
    detail:
      '落ち着いた水辺の空気でペースダウン。代表プレイヤー以外は1杯セーブ。',
    illustrationId: 'waterside',
  },

  waterside_rep_minus1: {
    id: 'waterside_rep_minus1',
    title: '水辺：代表クールダウン',
    summary: '代表のみ-1杯',
    detail:
      '涼しい風に当たり、少し休憩。代表プレイヤーのみ飲む量が1杯減ります。',
    illustrationId: 'waterside',
  },

  shitamachi_all_plus1: {
    id: 'shitamachi_all_plus1',
    title: '下町：ほろ酔い商店街',
    summary: '全員+1杯',
    detail:
      '人情味あふれる商店街で一杯。全員が追加で1杯追加で飲みます。',
    illustrationId: 'shitamachi',
  },

  shitamachi_rep_plus1: {
    id: 'shitamachi_rep_plus1',
    title: '下町：代表サービス',
    summary: '代表のみ+1杯',
    detail:
      '店主からのサービスで、代表プレイヤーだけ1杯追加されます。',
    illustrationId: 'shitamachi',
  },

  transfer_rep_draw_plus1: {
    id: 'transfer_rep_draw_plus1',
    title: '乗換：代表ボーナスドロー',
    summary: '代表がカード+1枚ドロー',
    detail:
      '乗換駅で時間調整。代表プレイヤーはカードを1枚多く引きます。',
    illustrationId: 'transfer',
  },

  transfer_rep_skip_action: {
    id: 'transfer_rep_skip_action',
    title: '乗換：代表アクション停止',
    summary: '代表はこのターンカード使用不可',
    detail:
      'バタバタして余裕がない代表。このターンはカードが使えません。',
    illustrationId: 'transfer',
  },
}

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