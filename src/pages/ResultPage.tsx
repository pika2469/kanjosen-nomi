import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { findStation } from '@/stations'

export function ResultPage() {
    const { game, setPage } = useGameStore()
    const stationInfo = findStation(game.currentStation)
    const event = game.currentEvent

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">リザルト</h2>
                <p className="text-sm text-gray-600">
                    "各プレイヤーの飲酒量", "Exp", "イベントログ"などを設置予定
                </p>
            </section>

            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div>ターン: {game.turn}</div>
                <div>フェーズ: {game.phase}</div>
                <div>
                    駅:{' '}
                    {stationInfo 
                    ? `${stationInfo.name} (${stationInfo.attr})`
                    : '未決定'}
                </div>
                {event && (
                    <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">駅イベント</div>
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-xs text-gray-600">{event.description}</div>
                    </div>
                )}
                <div>※現時点ではダミーデータのみ表示</div>
            </section>

            <section className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Button size="sm" onClick={() => setPage('turn')}>
                    次のターンへ
                </Button>
            </section>
        </div>
    )
}