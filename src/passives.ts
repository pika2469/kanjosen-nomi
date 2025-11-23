import type { PassiveNode, PassiveId, PassiveBranch, Player } from '@/types/game'

// 仮のツリー構成
export const PASSIVES: PassiveNode[] = [
    // 攻撃系パッシブ
    {
        id: 'attack_t1',
        branch: 'attack',
        tier: 1,
        name: '攻撃Lv1',
        description: '攻撃Lv1パッシブ',
        costSp: 1,
    },
    {
        id: 'attack_t2',
        branch: 'attack',
        tier: 2,
        name: '攻撃Lv2',
        description: '攻撃Lv2パッシブ',
        costSp: 1,
        requires: ['attack_t1'],
    },
    {
        id: 'attack_t3',
        branch: 'attack',
        tier: 3,
        name: '攻撃Lv3',
        description: '攻撃Lv3パッシブ',
        costSp: 1,
        requires: ['attack_t2'],
    },

    // 防御系パッシブ
    {
        id: 'safe_t1',
        branch: 'safe',
        tier: 1,
        name: '防御Lv1',
        description: '防御Lv1パッシブ',
        costSp: 1,
    },
    {
        id: 'safe_t2',
        branch: 'safe',
        tier: 2,
        name: '防御Lv2',
        description: '防御Lv2パッシブ',
        costSp: 1,
        requires: ['safe_t1'],
    },
    {
        id: 'safe_t3',
        branch: 'safe',
        tier: 3,
        name: '防御Lv3',
        description: '防御Lv3パッシブ',
        costSp: 1,
        requires: ['safe_t2'],
    },

    // トリック系
    {
        id: 'trick_t1',
        branch: 'trick',
        tier: 1,
        name: 'トリックLv1',
        description: 'トリックLv1パッシブ',
        costSp: 1,
    },
    {
        id: 'trick_t2',
        branch: 'trick',
        tier: 2,
        name: 'トリックLv2',
        description: 'トリックLv2パッシブ',
        costSp: 1,
        requires: ['trick_t1'],
    },
    {
        id: 'trick_t3',
        branch: 'trick',
        tier: 3,
        name: 'トリックLv3',
        description: 'トリックLv3パッシブ',
        costSp: 1,
        requires: ['trick_t2'],
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