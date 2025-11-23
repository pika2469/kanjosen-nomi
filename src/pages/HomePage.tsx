import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function HomePage() {
    const { setPage, players, addPlayer } = useGameStore()

    // デバッグ用：ダミープレイヤーを追加するヘルパ
    const handleAddDebugPlayer = () => {
        const index = players.length + 1
        const name = `プレイヤー${index}`

        // スタイルは仮で'attack'
        addPlayer(name, 'attack')
    }

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

            {/* デバッグ用セクション */}
            <section className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold text-gray-500">
                            デバッグ用プレイヤー操作
                        </div>
                        <div className="text-xs text-gray-500">
                            現在のプレイヤー人数: {players.length}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddDebugPlayer}
                    >
                        プレイヤーを追加(仮)
                    </Button>
                </div>
                <p className="text-[10px] text-gray-400">
                    本番環境ではこのボタンは削除予定
                </p>
            </section>

            <section className="border-t pt-4">
                    <Button
                        className="w-full py-2 text-sm"
                        variant="outline"
                        onClick={() => setPage('passives')}
                    >
                        パッシブツリー(SP管理)
                    </Button>    
            </section>
            
        </div>
    )
        
}