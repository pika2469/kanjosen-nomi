import { useGameStore } from '@/store/gameStore'

export default function RollPage() {
    const { game, players, setPage, proceedPhase, runRollPhaseForPlayer } = useGameStore()
    const phasePlayer = game.phasePlayerIndex != null ? players[game.phasePlayerIndex] : null

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【4】杯数抽選</h1>
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
                    ここに杯数抽選のUIを挿入。まずはデバッグ用に1人分だけ抽選
                </p>
                {phasePlayer && (
                    <button
                        type="button"
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                        onClick={() => runRollPhaseForPlayer(game.phasePlayerIndex!)}
                    >
                        {phasePlayer.name}の杯数を抽選
                    </button>
                )}
            </section>

            <section className="rounded border bg-white p-3 text-xs">
                <h2 className="mb-1 font-semibold">今ターンの杯数結果</h2>
                {game.currentDrinks.length === 0 ? (
                    <p className="text-gray-500">まだ抽選されていません</p>
                ) : (
                    <ul className="space-y-1">
                        {game.currentDrinks.map((d) => {
                            const p = players.find((pl) => pl.id === d.playerId)
                            return (
                                <li key={d.playerId} className="flex justify-between">
                                    <span>{p?.name ?? d.playerId}</span>
                                    <span>{d.final} 杯</span>
                                </li>
                            )
                        })}
                    </ul>
                )}
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
                            proceedPhase()
                            setPage('draw')
                        }}
                    >
                        次のフェーズへ
                    </button>
                </div>
            </section>
        </div>
    )
}