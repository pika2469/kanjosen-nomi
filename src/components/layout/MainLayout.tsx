import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

// コンポーネント本体の宣言
// <MainLayout><HomePage /></MainLayout>のように、ページコンポーネントを指定する想定
// 上記の場合、HomePage()関数を実行して得られるJavaScript要素のこと。（関数はHomePage.tsxで指定）
export function MainLayout({ children }: { children: ReactNode }) {
    const { ui, setPage } = useGameStore()

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 to-white text-gray-800">
            {/* ヘッダー */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-white/80 backdrop-blur">
                <div>
                    <h1 className="text-lg font-semibold">環状線飲みアプリ</h1>
                    <p className="text-xs text-gray-500">Placeholder UI / v10.3</p>
                </div>
            </header>

            {/* コンテンツ */}
            <main className="flex-1 p-4">
                {children}
            </main>

            {/* シンプルなフッターナビ */}
            <nav className="sticky botom-0 border-t bg-white/90 backdrop-blur px-3 py-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <Button
                        variant={ui.currentPage === 'home' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('home')}
                    >
                        Home
                    </Button>

                    <Button
                        variant={ui.currentPage === 'turn' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('turn')}
                    >
                        Turn
                    </Button>

                    <Button
                        variant={ui.currentPage === 'settings' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('settings')}
                    >
                        Settings
                    </Button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <Button
                        variant={ui.currentPage === 'roulette' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('roulette')}
                    >
                        Roulette
                    </Button>

                    <Button
                        variant={ui.currentPage === 'cardHand' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('cardHand')}
                    >
                        Cards
                    </Button>

                    <Button
                        variant={ui.currentPage === 'result' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage('result')}
                    >
                        Result
                    </Button>
                </div>



            </nav>
        </div>
    )
}