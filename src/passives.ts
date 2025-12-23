import type { PassiveNode, PassiveId, PassiveBranch, Player } from '@/types/game'

// ツリー構成(v1.4)
export const PASSIVES: PassiveNode[] = [
    // 攻撃系パッシブ
    {
        id: 'atk_tease',
        branch: 'attack',
        tier: 1,
        name: '飲むよ',
        description: 'アタックカードの対象が1人増える。',
        costSp: 1,
    },
    {
        id: 'atk_rate_up',
        branch: 'attack',
        tier: 2,
        name: 'アタックカード率up',
        description: 'アタックカードの出現率が20%上昇。',
        costSp: 1,
        requires: ['atk_tease'],
    },
    {
        id: 'atk_trigger',
        branch: 'attack',
        tier: 3,
        name: '追い杯',
        description: 'アタックカード使用時、50%の確率で追加攻撃が発生(+1杯)。',
        costSp: 1,
        requires: ['atk_rate_up'],
    },

    // 防御系パッシブ
    {
        id: 'safe_lighten',
        branch: 'safe',
        tier: 1,
        name: '軽減補正',
        description: '杯数抽選が少なめに出やすくなる。',
        costSp: 1,
    },
    {
        id: 'safe_rate_up',
        branch: 'safe',
        tier: 2,
        name: 'セーフカード率up',
        description: 'セーフカードの出現率が20%上昇。',
        costSp: 1,
        requires: ['safe_lighten'],
    },
    {
        id: 'safe_field_shield',
        branch: 'safe',
        tier: 3,
        name: 'フィールドシールド',
        description: '全員+1杯の効果を自分だけ受けない。',
        costSp: 1,
        requires: ['safe_rate_up'],
    },

    // トリック系
    {
        id: 'trick_chaos',
        branch: 'trick',
        tier: 1,
        name: 'カード運上昇',
        description: 'レア度R/SRのカードが少し出やすくなる。',
        costSp: 1,
    },
    {
        id: 'trick_rate_up',
        branch: 'trick',
        tier: 2,
        name: '特殊カード率up',
        description: 'スペシャルカードの出現率が20%上昇。',
        costSp: 1,
        requires: ['trick_chaos'],
    },
    {
        id: 'trick_dual_roll',
        branch: 'trick',
        tier: 3,
        name: 'デュアルロール',
        description: '杯数抽選を毎ターン2回行い、好きな方を選べるようになる。',
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

// -------------------------------------------------------
// Passive Icons
// -------------------------------------------------------
// Vite想定：passives.ts から見て ./assets/passives 配下を読む
const PASSIVE_ICON_MODULES = import.meta.glob('./assets/passives/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

/**
 * passiveId に対応するアイコンを返す
 * - 例: /src/assets/passives/atk_tease.png
 * - なければ default.png
 */
export function getPassiveIconSrc(id: PassiveId): string {
  const key = `./assets/passives/${id}.png`
  const fallback = `./assets/passives/default.png`
  return PASSIVE_ICON_MODULES[key] ?? PASSIVE_ICON_MODULES[fallback] ?? ''
}

