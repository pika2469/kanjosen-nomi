import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { getPassivesByBranch, hasPassive, canUnlockPassive } from '@/passives'

export function PassivesPages() {
    const { players, game, setPage, unlockPassive } = useGameStore()

    const branches: ('attack' | 'safe' | 'trick')[] = [
        'attack',
        'safe',
        'trick',
    ]

    const branchLabel: Record<typeof branches[number], string> = {
        attack: '攻撃ツリー',
        safe: '防御ツリー',
        trick: '特殊ツリー',
    }

    if (players.length === 0) {
        return (
            <div className="space-y-4">
                <section>
                    <h2 className="text-xl font-bold mb-1">パッシブツリー(仮)</h2>
                    <p className="text-sm text-gray-600">
                        プレイヤーが登録されていません。ホームからプレイヤーを追加してください。
                    </p>
                </section>
                <Button variant="outline" onClick={() => setPage('home')}>
                    ホームへ戻る
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">パッシブツリー(仮)</h2>
                <p className="text-sm text-gray-600">
                    SPを消費してパッシブをアンロックする画面です。
                </p>
            </section>

            {players.map((player) => (
                <section key={player.id} className="rounded-2xl border bg-white p-3 shadow-sm space-y-3">
                    {/* プレイヤー概要 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">プレイヤー</div>
                            <div className="font-semibold">{player.name}</div>
                        </div>

                        <div className="text-right text-xs text-gray-500">
                            <div>Lv {player.level}</div>
                            <div>Xp {player.xp}</div>
                            <div>SP {player.sp}</div>
                        </div>
                    </div>

                    {/* 各ブランチごとのパッシブツリー */}
                    <div className="grid gap-3">
                        {branches.map((b) => {
                            const nodes = getPassivesByBranch(b)
                            if (nodes.length === 0) return null

                            return (
                                <div key={b} className="rounded-xl border bg-gray-50 p-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-semibold text-gray-700">
                                            {branchLabel[b]}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            段数: {nodes.length}
                                        </div>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {nodes.map((node) => {
                                            const unlocked = hasPassive(player, node.id)
                                            const unlockable = canUnlockPassive(player, node)

                                            return (
                                                <li key={node.id} className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-500">
                                                                Tier {node.tier}
                                                            </span>
                                                            <span className="text-sm font-medium">
                                                                {node.name}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500">
                                                                SP {node.costSp}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                                            {node.description}
                                                        </div>
                                                        {node.requires && node.requires.length >0 && (
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                前提: {node.requires.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={unlocked ? 'outline' : 'default'}
                                                        disabled={unlocked || !unlockable}
                                                        onClick={() => unlockPassive(player.id, node.id)}
                                                    >
                                                        {unlocked ? '習得済' : unlockable ? '習得する' : '習得不可'}
                                                    </Button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}

            <section className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Button size="sm" onClick={() => setPage('turn')}>
                    ターン画面へ
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage('settings')}>
                    設定へ
                </Button>
            </section>           
        </div>
    )
}