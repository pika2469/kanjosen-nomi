import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function HomePage() {
    const { setPage, players, game } = useGameStore()

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">ホーム</h2>
                <p className="text-sm text-gray-600">
                    プレースホルダーUIです。ページ遷移と状態の確認用画面です。
                </p>
            </section>

            <section className="space-y-2">
                <div className="text-sm">
                    <div>プレイヤー人数: {players.length}</div>
                    <div>現在ターン: {game.turn}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setPage('turn')}>ゲーム開始(Turn画面へ)</Button>
                    <Button variant="outline" onClick={() => setPage('settings')}>
                        設定画面へ
                    </Button>
                </div>
            </section>
        </div>
    )
        
}