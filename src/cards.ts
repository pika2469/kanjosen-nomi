import type { Card, CardId, Player, Mood } from '@/types/game'
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
        id: 'atk_shoubu_time',
        kind: 'attack',
        rarity: 'R',
        name: '勝負タイム',
        description: '簡易ミニゲームで負けた1名が+1杯(現状はランダム1名が+1杯)',
    },
    {
        id: 'atk_shoot',
        kind: 'attack',
        rarity: 'R',
        name: '狙い撃ち',
        description: '指定された1名は今ターン杯数を再抽選',
    },
    {
        id: 'atk_field_break',
        kind: 'attack',
        rarity: 'SR',
        name: 'フィールドブレイク',
        description: '今ターン全員のセーフカード効果を無効化',
    },
    // セーフ系
    {
        id: 'safe_non_alcohol',
        kind: 'safe',
        rarity: 'SR',
        name: 'ノンアル券',
        description: 'このターンの自分の杯数を0杯にする',
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
        description: '自分の杯数を-2杯するが、次ターンの抽選杯数が上昇しやすい',
    },
    {
        id: 'safe_slue_guard',
        kind: 'safe',
        rarity: 'R',
        name: 'スルーガード',
        description: '全員+1杯系の加算効果を自分だけ無効化',
    },
    {
        id: 'safe_yukkuri_mode',
        kind: 'safe',
        rarity: 'R',
        name: 'ゆっくりモード',
        description: '次ターンの杯数抽選が下限寄りになる',
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
        description: '次ターンのカードドロー+1枚',
    },
    {
        id: 'sp_gain_xp',
        kind: 'special',
        rarity: 'R',
        name: '経験値ブースト',
        description: '使用者のXPが+1される',
    },
    {
        id: 'sp_random_change',
        kind: 'special',
        rarity: 'N',
        name: 'ランダムチェンジ',
        description: 'ランダム2名の杯数を入れ替える',
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

// カードタイプごとに出現率に重みを付ける関数
function getKindWeights(player: Player) {
    let attack = 1
    let safe = 1
    let special = 1

    // パッシブ補正
    if (hasAttackRateUp(player)) attack *= 1.2
    if (hasSafeRateUp(player)) safe *= 1.2
    if (hasTrickRateUp(player)) special *= 1.2

    return { attack, safe, special }
}

// レアリティごとの重み
function getRarityWeights(player: Player) {
    const chaos = hasTrickChaos(player)

    if (!chaos) {
        return {
            N: 70,
            R: 20,
            SR: 10,
        }
    }

    // カオスカード(特殊ツリー1段階)
    return {
        N: 60,
        R: 25,
        SR: 15,
    }
}

type DrawContext = {
    mood?: Mood | null
    forceRareOnly?: boolean // balance用：「このドローは必ずR/SRのフラグ」
}

// カードをランダムに1枚ドローする関数
// パッシブやスキル重みを考慮してドローする
export function drawRandomCardId(
    player: Player,
    context?: DrawContext,
): CardId {
    const kindW = getKindWeights(player) // パッシブ由来の種別(attack/safe/special)
    const rarityW = getRarityWeights(player) // パッシブ由来のレアリティ重み

    // balance用：R/SR限定ドローを行うかどうか
    const basePool =
        context?.forceRareOnly
            ? CARDS.filter((c) => c.rarity ==='R' || c.rarity === 'SR')
            : CARDS

    // 万一 R/SR が0枚になった場合のフォールバック
    const pool = basePool.length > 0 ? basePool : CARDS

    // kind x rarityの総合重みを計算
    // weightedPoolは空の配列：カード1枚と、その重みを入れる箱
    const weightedPool: { card: Card; weight: number }[] = []

    for (const c of pool) {
        // 種別の重み
        const kw =
            c.kind === 'attack' 
            ? kindW.attack
            : c.kind === 'safe'
            ? kindW.safe
            : kindW.special
        
        // レアリティごとの重み
        const rw = rarityW[c.rarity]

        // ムードによる追加補正
        let moodW = 1
        const mood = context?.mood ?? null

        if (mood === 'aggressive' && c.kind === 'attack') {
            // アタックモード：アタックカード+15%
            moodW *= 1.15
        } else if (mood === 'defensive' && c.kind === 'safe') {
            // セーフモード：セーフカード+15%
            moodW *= 1.15
        } else if (mood === 'lucky' && (c.rarity === 'R' || c.rarity === 'SR')) {
            // ハッピードロー：R/SR+15%
            moodW *= 1.15
        }

        // balance(ブーストタイム)は、gameStoreでforceRareOnlyを立てることで反映
        
        const weight = kw * rw * moodW

        weightedPool.push({ card: c, weight })
    }

    // 重み付きでランダムで1枚を選択する
    const total = weightedPool.reduce((s, x) => s + x.weight, 0)
    let r = Math.random() * total

    // 重みを順に引き算していき、マイナスになったカードを選ぶ
    for (const entry of weightedPool) {
        if (r < entry.weight) {
            return entry.card.id
        }
        r -= entry.weight
    }
    
    // 万が一上記処理を抜けた場合は、最終カードを選択
    return weightedPool[weightedPool.length - 1].card.id

}

