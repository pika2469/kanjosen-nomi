import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { usePhaseController } from '@/features/phase/PhaseController'
import { getMoodInfo } from '@/constants/mood'
import { findStation } from '@/stations'

export function TurnPage() {
    const { players, game, setPage, runStationPhase } = useGameStore()
    const { phase, proceed } = usePhaseController()
    const moodInfo = getMoodInfo(game.mood)

    const activePlayer = players[game.activePlayerIndex]
    const stationInfo = findStation(game.currentStation)
    const event = game.currentEvent

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">ターン進行</h2>
                <p className="text-sm text-gray-600">
                    現在のフェーズと代表プレイヤーを確認する画面です。
                </p>
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">ターン</div>
                    <div className="text-2xl font-semibold">{game.turn}</div>
                </div>

                <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">フェーズ</div>
                    <div className="text-lg font-mono">{phase}</div>
                </div>

                {moodInfo && (
                    <div className="rounded-xl border bg-white p-3 shadow-sm col-span-2">
                        <div className="text-xs text-gray-500 mb-1">ムード</div>
                        <div className="gap-2">
                            <span className="text-lg">{moodInfo.icon}</span>
                            <span className="text-sm font-medium">{moodInfo.label}</span>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border bg-white p-3 shadow-sm col-span-2">
                    <div className="text-xs text-gray-500 mb-1">代表プレイヤー</div>
                    <div className="text-base">
                        {activePlayer ? activePlayer.name : '未登録'}
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-3 shadow-sm col-span-2">
                    <div className="text-xs text-gray-500 mb-1">現在の駅</div>
                    <div className="text-base">
                        {stationInfo ? `${stationInfo.name} (${stationInfo.attr})` : '未決定'}
                    </div>
                </div>

                {/* 駅イベントがあれば表示 */}
                {event && (
                    <div className="rounded-xl border bg-white p-3 shadow-sm col-span-2">
                        <div className="text-xs text-gray-500 mb-1">駅イベント</div>
                        <div className="text-sm font-semibold mb-1">{event.title}</div>
                        <div className="text-xs text-gray-600">{event.description}</div>
                    </div>
                )}
            </section>

            {/* 通常操作 */}
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

            {/* デバッグ用 */}
            <section className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runStationPhase(1, 'cw')}
                    >
                        次の駅へ進む(1駅/時計回り/デバッグ用)
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runStationPhase(1, 'ccw')}
                    >
                        次の駅へ進む(1駅/逆方向/デバッグ用)
                    </Button>
                </div>
                <p className="text-xs text-gray-500">
                    ※本番ではサイコロやルーレットから steps(1~6)と方向を決める予定
                </p>
            </section>

        </div>
    )
}