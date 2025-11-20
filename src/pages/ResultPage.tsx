import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { findStation } from '@/stations'
import { getMoodInfo } from '@/constants/mood'

export function ResultPage() {
    const { game, players, setPage, runProgressPhase } = useGameStore()
    const stationInfo = findStation(game.currentStation)
    const event = game.currentEvent
    const moodInfo = getMoodInfo(game.mood)

    // playerId から Player を引くヘルパ
    const getPlayerName = (playerId: string) =>
        players.find((p) => p.id === playerId)?.name ?? '不明なプレイヤー'

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">リザルト</h2>
                <p className="text-sm text-gray-600">
                    "各プレイヤーの飲酒量", "Exp", "イベントログ"などを設置予定
                </p>
            </section>

            {/* 概要: ターン / フェーズ / ムード / 駅 / イベント */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div>ターン: {game.turn}</div>
                <div>フェーズ: {game.phase}</div>

                {moodInfo && (
                    <div className="gap-2">
                        <span className="text-xs text-gray-500">ムード:</span>
                        <span className="text-lg">{moodInfo.icon}</span>
                        <span className="text-sm font-medium">{moodInfo.label}</span>
                    </div>
                )}

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

            {/* 各プレイヤーの杯数結果 */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div className="text-xs text-gray-500 mb-1">今回の杯数</div>

                {game.currentDrinks.length === 0 ? (
                    <div className="text-xs text-gray-500">
                        まだ杯数が抽選されていません。(Turn画面から実行)
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {game.currentDrinks.map((r) => (
                            <li key={r.playerId} className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium mr-2">
                                        {getPlayerName(r.playerId)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        基本: {r.base} / ムード: {r.moodMod >= 0 ? '+' : ''}
                                        {r.moodMod} / イベント: {r.eventMod >=0 ? '+' : ''}
                                        {r.eventMod} / パッシブ: {r.passiveMod >= 0 ? '+' : ''}
                                        {r.passiveMod}
                                    </span>
                                </div>
                                <div className="text-lg font-semibold">{r.total}杯</div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 各プレイヤーのLv / XP / SP一覧 */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div className="text-xs text-gray-500 mb-1">プレイヤー成長状況</div>
                {players.length === 0 ? (
                    <div className="text-xs text-gray-500">プレイヤーが登録されていません</div>
                ) : (
                    <ul className="space-y-1">
                        {players.map((p) => (
                            <li key={p.id} className="items-center justify-between">
                                <div>
                                    <span className="font-medium mr-2">{p.name}</span>
                                    <span className="text-xs text-gray-500">
                                        Lv {p.level} / XP {p.xp} / SP {p.sp}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* このターンの杯数をXPに反映（デバッグ用） */}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={runProgressPhase}
                >
                    今ターンの杯数をXPに反映
                </Button>
                <p className="text-[10px] text-gray-400">
                    本番ではフェーズ7(成長判定)で自動実行予定
                </p>

            </section>

            <section className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Button size="sm" onClick={() => setPage('turn')}>
                    次のターンへ
                </Button>
            </section>
        </div>
    )
}