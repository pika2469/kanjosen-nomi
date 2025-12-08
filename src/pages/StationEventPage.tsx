import { useGameStore } from '@/store/gameStore'

export default function StationEventPage() {
    const { game, players, setPage, proceedPhase } = useGameStore()
    const activePlayer = players[game.activePlayerIndex] ?? null

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【3】駅イベント</h1>
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

            <section className="rounded border bg-white p-3 text-sm">
                <p className="mb-2 text-gray-700">
                    駅イベントの内容を表示する画面
                </p>
                <p className="text-xs text-gray-600">
                    現在イベントID: {game.currentEvent?.id ?? 'なし'}
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
                        setPage('roll')
                    }}
                >
                    次のフェーズへ
                </button>
                </div>
            </section>
        </div>


    )
}