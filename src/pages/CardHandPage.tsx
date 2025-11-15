import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'

const dummyCards = [
    { id: 'c1', label: '🟥 ＋1券（個人）', desc: '任意の1名に+1杯' },
    { id: 'c2', label: '🟦 ノンアル券', desc: '任意の1名に+1杯' },
    { id: 'c3', label: '🟪 再抽選券', desc: '任意の1名に+1杯' }
]

export function CardHandPage() {
    const { setPage } = useGameStore()

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">カード</h2>
                <p className="text-sm text-gray-600">
                    カード画面のレイアウトの雰囲気を確認するページ
                </p>
            </section>

            <section className="grid gap-3">
                {dummyCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
                        <div>
                            <div className="font-semibold text-sm">{card.label}</div>
                            <div className="text-xs text-gray-500">{card.desc}</div>
                        </div>
                        <Button size="sm" variant="outline">
                            使う（仮）
                        </Button>
                    </div>
                ))}
            </section>

            <section className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Button variant="outline" size="sm" onClick={() => setPage('turn')}>
                    ターン画面に戻る
                </Button>
            </section>
        </div>
    )
}