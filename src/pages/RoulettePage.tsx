import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

const moods = ['🌞 テンションMAX', '🌙 まったり', '🔥 攻めの気配', '💧 守りの風', '💫 幸運の兆し', '⚖️ 均衡モード']

export function RoulettePage() {
    const { setPage } = useGameStore()
    // const [状態の値, 状態を更新する関数] = useState<型>(初期値)
    const [current, setCurrent] = useState<string | null>(null)

    function spin() {
        const i = Math.floor(Math.random() * moods.length)
        setCurrent(moods[i])
        // 将来ここでZustandのmoodを更新する(setMood)
    }


    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">運命ルーレット</h2>
                <p className="text-sm text-gary-600">
                    ルーレットロジックは未定義。現時点では”回す→結果が出る”流れだけ確認
                </p>
            </section>

            <section className="flex flex-col items-center gap-4">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-sky-300 bg-sky-50 shadow-inner">
                    <span className="text-center text-sm text-gray-700 px-4">
                        {current ?? 'タープしてルーレットを回す'}
                    </span>
                </div>
                <Button onClick={spin}>ルーレットを回す</Button>
            </section>

            <section className="flex flex-wrap gap-2 text-xs text-gray-600">
                <Button variant="outline" size="sm" onClick={() => setPage('turn')}>
                    ターン画面に戻る
                </Button>
            </section>
        </div>
    )
}