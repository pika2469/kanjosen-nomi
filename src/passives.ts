import type { PassiveNode, PassiveId, PassiveBranch, Player } from '@/types/game'

// ツリー構成(v1.4)
export const PASSIVES: PassiveNode[] = [
    // 攻撃系パッシブ
    {
        id: 'atk_tease',
        branch: 'attack',
        tier: 1,
        name: '攻撃Lv1',
        description: '攻撃Lv1: 煽り上手',
        costSp: 1,
    },
    {
        id: 'atk_rate_up',
        branch: 'attack',
        tier: 2,
        name: '攻撃Lv2',
        description: '攻撃Lv2: 攻撃カード率up',
        costSp: 1,
        requires: ['atk_tease'],
    },
    {
        id: 'atk_trigger',
        branch: 'attack',
        tier: 3,
        name: '攻撃Lv3',
        description: '攻撃Lv3: 攻撃トリガー',
        costSp: 1,
        requires: ['atk_rate_up'],
    },

    // 防御系パッシブ
    {
        id: 'safe_lighten',
        branch: 'safe',
        tier: 1,
        name: '防御Lv1',
        description: '防御Lv1: 軽減補正',
        costSp: 1,
    },
    {
        id: 'safe_rate_up',
        branch: 'safe',
        tier: 2,
        name: '防御Lv2',
        description: '防御Lv2: セーフカード率up',
        costSp: 1,
        requires: ['safe_lighten'],
    },
    {
        id: 'safe_field_shield',
        branch: 'safe',
        tier: 3,
        name: '防御Lv3',
        description: '防御Lv3: フィールドシールド',
        costSp: 1,
        requires: ['safe_rate_up'],
    },

    // トリック系
    {
        id: 'trick_chaos',
        branch: 'trick',
        tier: 1,
        name: 'トリックLv1',
        description: 'トリックLv1: カオスカード',
        costSp: 1,
    },
    {
        id: 'trick_rate_up',
        branch: 'trick',
        tier: 2,
        name: 'トリックLv2',
        description: 'トリックLv2: 特殊カード率up',
        costSp: 1,
        requires: ['trick_chaos'],
    },
    {
        id: 'trick_dual_roll',
        branch: 'trick',
        tier: 3,
        name: 'トリックLv3',
        description: 'トリックLv3: デュアルロール',
        costSp: 1,
        requires: ['trick_rate_up'],
    },
]

export function getPassiveId(id: PassiveId): PassiveNode | null {
    return PASSIVES.find((p) => p.id === id) ?? null
}

export function getPassivesByBranch(branch: PassiveBranch): PassiveNode[] {
    // パッシブ系統でソート→ tier順でソート（tierが小さい順に並び替え）
    return PASSIVES.filter((p) => p.branch === branch).sort(
        (a, b) => a.tier - b.tier,
    )
}

// アンロック済かどうか判断する関数
export function hasPassive(player: Player, id: PassiveId): boolean {
    return player.passives.includes(id)
}

// アンロック可能かどうかSPと前提パッシブから判定する関数
export function canUnlockPassive(player: Player, node: PassiveNode): boolean {
    if (hasPassive(player, node.id)) return false // アンロック済ならスルー
    if (player.sp < node.costSp) return false   // SP不足ならスルー

    // 前提パッシブがある場合
    if (node.requires && node.requires.length > 0) {

        // プレイヤーが前提パッシブをすべて持っているか？
        const allReqOk = node.requires.every((req) =>
            player.passives.includes(req),
        )
        if (!allReqOk) return false
    }

    // 上記の条件をすべて満たす場合にTrueを返す
    return true
}

// パッシブ効果毎に関数を定義（将来の拡張性のために個別で用意する）
export const hasAttackTease         = (p: Player) => hasPassive(p, 'atk_tease')
export const hasAttackRateUp        = (p: Player) => hasPassive(p, 'atk_rate_up')
export const hasAttackTrigger       = (p: Player) => hasPassive(p, 'atk_trigger')
export const hasSafeLighten         = (p: Player) => hasPassive(p, 'safe_lighten')
export const hasSafeRateUp          = (p: Player) => hasPassive(p, 'safe_rate_up')
export const hasSafeFieldShield     = (p: Player) => hasPassive(p, 'safe_field_shield')
export const hasTrickChaos          = (p: Player) => hasPassive(p, 'trick_chaos')
export const hasTrickRateUp         = (p: Player) => hasPassive(p, 'trick_rate_up')
export const hasTrickDualRoll       = (p: Player) => hasPassive(p, 'trick_dual_roll')



