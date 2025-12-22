import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { getCardById } from '@/cards'

export function CardHandPage() {
    const { players, game, setPage, useCard } = useGameStore()

    const activePlayer = players[game.activePlayerIndex]
    const lastUsed = game.lastUsedCard

    if (!activePlayer) {
        return (
            <div className="space-y-4">
                <section>
                    <h2 className="text-xl font-bold mb-1">カード</h2>
                    <p className="text-sm text-gray-600">
                        プレイヤーが登録されていません。ホームからプレイヤーを追加してください。
                    </p>
                </section>
                <Button variant="outline" onClick={() => setPage('home')}>
                    ホームへ戻る
                </Button>
            </div>
        )
    }

    const isBlocked = game.cardUsageBlockedForPlayerId === activePlayer.id

    const handleUseCard = (cardId: string) => {
        if (isBlocked) return
        useCard(activePlayer.id, cardId as any)
    }

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">カード使用（仮）</h2>
                <p className="text-sm text-gray-600">
                    代表プレイヤーの手札から使うカードを選ぶ画面
                </p>
            </section>

            <section className="rounded-xl border bg-white p-3 shadow-sm space-y-2 text-sm">
                <div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">代表プレイヤー</div>
                        <div className="font-medium">{activePlayer.name}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                        手札 {activePlayer.hand.length} / {activePlayer.handSizeMax}
                    </div>
                </div>

                {/* 代表プレイヤーブロック中メッセージ */}
                {isBlocked && (
                    <div className="mt-2 rounded-md border bg-red-50 border-red-100 px-2 py-1 text-[11px] text-red-600">
                        このターンは乗換イベントの影響で、代表はカードを使用できません
                    </div>
                )}

                {/* 手札一覧 */}
                {activePlayer.hand.length === 0 ? (
                    <div className="text-xs text-gray-500 mt-2">
                        手札がありません
                    </div>
                ) : (
                    <ul className="mt-2 space-y-2">
                        {activePlayer.hand.map((cardId) => {
                            const card = getCardById(cardId)
                            if (!card) return null
                            const kindLabel =
                                card.kind === 'attack'
                                ? '攻撃'
                                : card.kind === 'safe'
                                ? 'セーフ'
                                : '特殊'
                            
                            return (
                                <li
                                    key={cardId + Math.random()}
                                    className="border p-2 flex items-start justify-between gap-2"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500">
                                                [{kindLabel}]
                                            </span>
                                            <span className="text-sm font-medium">{card.name}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                            {card.description}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUseCard(cardId)}
                                        disabled={isBlocked}    // 代表ブロック時は押せない
                                    >
                                        使う
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {/* 直近で使ったカード（あれば） */}
            {lastUsed && (
                <section className="rounded-xl border bg-white p-3 shadow-sm space-y-1 text-sm">
                    <div className="font-semibold text-gray-700 mb-1">直近使ったカード</div>
                    <div>ターン: {lastUsed.usedAtTurn}</div>
                    <div>playerId: {lastUsed.playerId}</div>
                    <div>cardId: {lastUsed.cardId}</div>
                    <div className="text-[10px] text-gray-400">
                        ※ デバッグ用の生ID表示
                    </div>
                </section>
            )}

            <section className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Button size="sm" onClick={() => setPage('mood')}>
                    ターン画面へ戻る
                </Button>
            </section>
        </div>
    )
}