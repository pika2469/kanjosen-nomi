import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import { getMoodInfo } from '@/constants/mood'

export function RoulettePage() {
    const { setPage, game, spinMood, clearMood } = useGameStore()
    const moodInfo = getMoodInfo(game.mood)

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">ムードルーレット</h2>
                <p className="text-sm text-gary-600">
                    このターン全体の雰囲気(ムード)を決めます。
                </p>
            </section>

            <section className="flex flex-col items-center gap-4">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-sky-300 bg-sky-50 shadow-inner">
                    {moodInfo ? (
                        <div className="text-center px-4">
                            <div className="text-3xl mb-1">{moodInfo.icon}</div>
                            <div className="text-sm font-semibold">{moodInfo.label}</div>
                        </div>
                    ) : (
                        <span className="text-center text-sm text-gray-700 px-4">
                            ボタンを押してムードを決定
                        </span>
                    )}
                </div>
                
                {/* ムード決定ボタン */}
                <Button onClick={spinMood}>ムードを決める</Button>
                
                {/* ムード消去ボタン：デバッグ用 */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMood}
                >
                    ムードをクリア
                </Button>
                {moodInfo && (
                    <p className="text-xs text-gray-600 text-center px-4">
                        {moodInfo.description}
                    </p>
                )}
                
            </section>

            <section className="flex flex-wrap gap-2 text-xs text-gray-600">
                <Button variant="outline" size="sm" onClick={() => setPage('turn')}>
                    ターン画面に戻る
                </Button>
            </section>
        </div>
    )
}