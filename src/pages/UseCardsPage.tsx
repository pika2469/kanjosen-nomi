import { useGameStore } from '@/store/gameStore'
import type { CardId } from '@/types/game'

export default function UseCardsPage() {
    const { game, players, setPage, proceedPhase, useCard } = useGameStore()
    const phasePlayer =
        game.phasePlayerIndex != null ? players[game.phasePlayerIndex] : null

    const handleUseCard = (cardId: CardId) => {
        if (!phasePlayer) return
        useCard(phasePlayer.id, cardId)
    }

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【6】カード使用</h1>
                <p className="text-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
                <p className="text-xs text-gray-700">
                    処理中プレイヤー:{' '}
                    {phasePlayer ? phasePlayer.name : '未選択'}
                </p>
            </header>
            
            <section className="rounded border bg-white p-3 text-xs">
                {!phasePlayer ? (
                    <p className="text-gray-600">処理中プレイヤーがいません</p>
                ) : phasePlayer.hand.length === 0 ? (
                    <p className="text-gray-600">
                        {phasePlayer.name}は現在カードを所持していません
                    </p>
                ) : (
                    <div className="space-y-2">
                        {phasePlayer.hand.map((cardId, idx) => (
                            <div
                                key={`${cardId}-${idx}`}
                                className="flex items-center justify-center rounded border bg-white px-2 py-1 gap-2"
                            >
                                <span className="font-mono text-xs">{cardId}</span>
                                <button
                                    type="button"
                                    className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                                    onClick={() => handleUseCard(cardId)}
                                >
                                    使用
                                </button>
                            </div>
                        ))}
                    </div>
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
                            const idx = game.phasePlayerIndex ?? 0
                            const playerCount = players.length

                            proceedPhase()

                            if (idx + 1 < playerCount) {
                                setPage('useCards')
                            } else {
                                setPage('progress')
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