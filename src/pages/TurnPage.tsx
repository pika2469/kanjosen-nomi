import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { usePhaseController } from '@/features/phase/PhaseController'

export function TurnPage() {
    const { players, game, setPage } = useGameStore()
    const { phase, proceed } = usePhaseController()

    const activePlayer = players[game.activePlayerIndex]

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">ターン進行</h2>
                <p className="text-sm text-gray-600">
                    現在のフェーズと代表プレイヤーを確認する画面です。
                </p>
            </section>

            <section className="grid grid-cols-2 text-sm">
                <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">ターン</div>
                    <div className="text-2xl font-semibold">{game.turn}</div>
                </div>

                <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">フェーズ</div>
                    <div className="text-lg font-mono">{phase}</div>
                </div>

                <div className="rounded-xl border bg-white p-3 shadow-sm col-span-2">
                    <div className="text-xs text-gray-500 mb-1">代表プレイヤー</div>
                    <div className="text-base">
                        {activePlayer ? activePlayer.name : '未登録'}
                    </div>
                </div>
            </section>

            <section className="flex flex-wrap gap-2">
                <Button onClick={proceed}>次フェーズへ</Button>
                <Button variant="outline" onClick={() => setPage('roulette')}>
                    ルーレット画面へ
                </Button>
                <Button variant="outline" onClick={() => setPage('cardHand')}>
                    カード画面へ
                </Button>
                <Button variant="outline" onClick={() => setPage('result')}>
                    結果画面へ
                </Button>
            </section>
        </div>
    )
}