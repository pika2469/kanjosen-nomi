import { useGameStore } from '@/store/gameStore'


export default function StationPage() {
    const { game, players, setPage, proceedPhase } = useGameStore()
    const activePlayer = players[game.activePlayerIndex] ?? null

    return (
        <div>
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【2】駅決定</h1>
                <p className="text-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
                {activePlayer && (
                <p className="text-xs text-gray-700">
                    代表プレイヤー: {activePlayer.name}
                </p>
                )}
                <p className="text-xs text-gray-600">
                    現在駅: {game.currentStation ?? '未決定'}
                </p>
            </header>

            <section>
                <p className="text-gray-700">
                    進む駅数と方向を決めるUIをここに挿入予定
                </p>
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
                        setPage('stationEvent')
                    }}
                >
                    次のフェーズへ
                </button>
                </div>
            </section>
        </div>
    )
}