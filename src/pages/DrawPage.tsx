import { useGameStore } from '@/store/gameStore'

export default function DrawPage() {
    const { game, players, setPage, proceedPhase, drawCard } = useGameStore()
    const phasePlayer =
        game.phasePlayerIndex != null ? players[game.phasePlayerIndex] : null

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【5】カードドロー</h1>
                <p className="text-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
                <p className="text-xs text-gray-700">
                    処理中プレイヤー:{' '}
                    {phasePlayer ? phasePlayer.name : '未選択'}
                </p>
            </header>

            <section className="rounded border bg-white p-3 text-sm">
                <p className="mb-2 text-gray-700">
                    カードドローのUIをここに挿入
                </p>
                {phasePlayer && (
                    <button
                        type="button"
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                        onClick={() => drawCard(phasePlayer.id)}
                    >
                        {phasePlayer.name}が1枚ドロー
                    </button>
                )}
            </section>

            <section className="rounded border bg-white p-3 text-xs">
                <h2 className="mb-1 font-semibold">手札上限</h2>
                <ul className="space-y-1">
                    {players.map((p) => (
                        <li key={p.id} className="flex justify-between">
                            <span>{p.name}</span>
                            <span>{p.hand.join(', ') || '(なし)'}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex justify-between gap-2 text-xs">
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setPage('home')}
                >
                Homeへ
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded border px-3 py-1"
                        onClick={() => setPage('debug')}
                    >
                        Debugページへ
                    </button>
                    <button
                        type="button"
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        onClick={() => {
                            const idx = game.phasePlayerIndex ?? 0
                            const playerCount = players.length

                            // フェーズ遷移 (state更新)
                            proceedPhase()

                            // 自分が最後のプレイヤーかどうかで遷移先を変える
                            if (idx + 1 < playerCount) {
                                // まだプレイヤーがいる場合、次プレイヤーのrollへ
                                setPage('roll')
                            } else {
                                // 全員分のroll/drawが終わった → useCardsへ
                                setPage('useCards')
                            }
                        }}
                    >
                        次のフェーズへ
                    </button>
                </div>
            </section>
        </div>
    )
}