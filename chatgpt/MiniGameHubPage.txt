import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function MiniGameHubPage() {
    const { setPage } = useGameStore()

    return (
        <div className="space=y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">ミニゲーム</h2>
                <p className="text-sm text-gray-600">
                    本編とは独立した、おまけのミニゲーム集（中身は未実装）
                </p>
            </section>

            <section className="space-y-2 text-sm text-gray-500">
                <p>ミニゲーム1（仮）</p>
                <p>ミニゲーム2（仮）</p>
                <p>など</p>
            </section>

            <section>
                <Button variant="outline" onClick={() => setPage('home')}>
                    ホームに戻る
                </Button>
            </section>
        </div>
    )
}