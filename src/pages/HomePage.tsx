import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function HomePage() {
    const { setPage } = useGameStore()

    return (
        <div className="space-y-6">
            <section>
                <h2 className="text-xl font-bold mb-1">ホーム</h2>
                <p className="text-sm text-gray-600">
                    Homeページ
                </p>
            </section>

            <section className="space-y-3">
                {/* 環状線飲みスタート */}
                <Button
                    className="w-full py-4 text-base"
                    onClick={() => setPage('turn')}
                >
                    🍶 環状線飲みスタート
                </Button>

                {/* ミニゲームで遊ぶ */}
                <Button
                    className="w-full py-4 text-base"
                    variant="outline"
                    onClick={() => setPage('minigame')}
                >
                    🎮 ミニゲームで遊ぶ
                </Button>

                {/* 設定 */}
                <Button
                    className="w-full py-4 text-base"
                    variant="ghost"
                    onClick={() => setPage('settings')}
                >
                    ⚙️ 設定
                </Button>
            </section>
            
        </div>
    )
        
}