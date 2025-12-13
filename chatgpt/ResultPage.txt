import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { findStation } from '@/stations'
import { getMoodInfo } from '@/constants/mood'
import { getCardById } from '@/cards'
import { calcTurnXpFromDrinks } from '@/xpLogic'

export function ResultPage() {
    const { game, players, setPage, runProgressPhase, nextTurn } = useGameStore()
    const stationInfo = game.currentStation ? findStation(game.currentStation) : null
    const event = game.currentEvent
    const moodInfo = getMoodInfo(game.mood)

    // playerId から Player を引くヘルパ
    const getPlayerName = (playerId: string) =>
        players.find((p) => p.id === playerId)?.name ?? '不明なプレイヤー'

    // このターンにプレイヤーが獲得したXPを計算
    const getXpGainForPlayer = (playerId: string) => {
        if (!game.currentDrinks || game.currentDrinks.length === 0) return 0
        return game.currentDrinks
            .filter((d) => d.playerId === playerId)
            .reduce((sum, d) => sum + calcTurnXpFromDrinks(d.final), 0)
    }

    // カードログ（最後に使用されたカード）
    const lastUsed = game.lastUsedCard
    const lastCard = lastUsed ? getCardById(lastUsed.cardId) : null
    const lastUser = lastUsed
        ? players.find((p) => p.id === lastUsed.playerId)
        : null
    
    const handleNextTurn = () => {
        nextTurn()
        setPage('mood')
    }

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">リザルト</h2>
                <p className="text-sm text-gray-600">
                    このターンの杯数・XP・イベント・カード使用状況のサマリ
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
            </section>

            {/* 今ターンのカードログ */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div className="text-xs text-gray-500 mb-1">カードログ</div>
                {lastUsed ? (
                    <div className="space-y-1">
                        <div>
                            <span className="font-medium mr-2">
                                {lastUser?.name ?? '不明なプレイヤー'}
                            </span>
                            <span className="text-xs text-gray-500">
                                が「{lastCard?.name ?? lastUsed.cardId}」を使用
                            </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                            使用ターン: {lastUsed.usedAtTurn} / カードID: {lastUsed.cardId}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs texe-gray-500">
                        このターンに使用されたカードはありません。
                    </div>
                )}
            </section>

            {/* 各プレイヤーの杯数結果 */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div className="text-xs text-gray-500 mb-1">今回の杯数とXP</div>

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
                                <div className="text-right">
                                    <div className="text-lg font-semibold">
                                        {r.final}杯
                                    </div>
                                    <div className="text-[11px] text-emerald-600">
                                        +{calcTurnXpFromDrinks(r.final)} XP
                                    </div>
                                </div>
                                
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 各プレイヤーのLv / XP / SP + このターンのXP増分 */}
            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div className="text-xs text-gray-500 mb-1">プレイヤー成長状況</div>
                {players.length === 0 ? (
                    <div className="text-xs text-gray-500">プレイヤーが登録されていません</div>
                ) : (
                    <ul className="space-y-1">
                        {players.map((p) => {
                            const gain = getXpGainForPlayer(p.id)
                            return (
                                <li key={p.id} className="items-center justify-between">
                                    <div>
                                        <span className="font-medium mr-2">{p.name}</span>
                                        <span className="text-xs text-gray-500">
                                            Lv {p.level} / XP {p.xp} / SP {p.sp}
                                        </span>
                                    </div>
                                    {gain > 0 && (
                                        <div className="text-[11px] text-emerald-600">
                                            このターン +{gain} XP
                                        </div>
                                    )}
                                </li>
                            )
                            
})}
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
                <button 
                    type="button"
                    className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    onClick={handleNextTurn}>
                    次のターンへ
                </button>
            </section>
        </div>
    )
}