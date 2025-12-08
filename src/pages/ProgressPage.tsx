import { useGameStore } from '@/store/gameStore'

export default function ProgressPage() {
    const { game, players, setPage, proceedPhase, runProgressPhase } = useGameStore()

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【7】成長判定</h1>
                <p className="txt-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
            </header>

            <section className="rounded border bg-white p-3 text-sm">
                <p className="mb-2 text-gray-700">
                    今ターンの杯数からXP, Lv, SPを反映
                </p>
                <button
                    type="button"
                    className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    onClick={() => runProgressPhase()}
                >
                    成長判定を実行
                </button>
            </section>

            <section className="rounded border bg-white p-3 text-xs">
                <h2 className="mb-1 font-semibold">プレイヤー一覧</h2>
                <ul className="space-y-1">
                    {players.map((p) => (
                        <li key={p.id} className="flex justify-between">
                            <span>{p.name}</span>
                            <span>
                                Lv {p.level} / XP {p.xp} / SP {p.sp}
                            </span>
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
                            proceedPhase()
                            setPage('result')
                        }}
                    >
                        次のフェーズへ
                    </button>
                </div>
            </section>
        </div>
    )
}