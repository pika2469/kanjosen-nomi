import { useGameStore } from '@/store/gameStore'

export default function MoodPage() {
    const { game, players, setPage, proceedPhase, spinMood, clearMood } = useGameStore()

    const activePlayer = players[game.activePlayerIndex] ?? null

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【1】ムード決定</h1>
                <p className="text-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
                {activePlayer && (
                    <p className="text-xs text-gray-700">
                        代表プレイヤー: {activePlayer.name}
                    </p>
                )}
            </header>

            <section className="rounded border bg-white p-3 text-sm">
                <p className="mb-2 text-gray-700">
                    ムードを決めるUIをここに挿入予定
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                        onClick={() => spinMood()}
                    >
                        ムード抽選
                    </button>
                    <button
                        type="button"
                        className="rounded border px-3 py-1 text-xs"
                        onClick={() => clearMood()}
                    >
                        ムードリセット
                    </button>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                    現在のムードID: {game.mood ?? '未決定'}
                </div>
            </section>

            <section className="flex justify-between gap-2 text-xs">
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setPage('home')}
                >
                    Homeへ
                </button>
                
                <div>
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
                            setPage('station')
                        }}
                    >
                        次のフェーズへ
                    </button>
                </div>
            </section>
        </div>
    )
}