import { useState } from "react"
import { Button } from "@/components/ui/button"   // ← shadcn/ui のボタン
import "./index.css"                              // Tailwind を反映
import "./App.css"                                // 既存CSSも読み込み（任意）

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-50 to-white text-gray-800">
      {/* タイトル部分 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">環状線飲みアプリ</h1>
        <p className="text-sm text-gray-500">React + Vite + Tailwind + shadcn/ui</p>
      </div>

      {/* カウンター部分 */}
      <div className="space-y-4 text-center">
        <Button variant="default" onClick={() => setCount((count) => count + 1)}>
          🍻 かんぱい！ ({count})
        </Button>
        <p className="text-xs text-gray-500">クリックでカウントが増えます</p>
      </div>

      {/* 既存のロゴを残したい場合 */}
      <div className="flex gap-4 mt-8 opacity-70">
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src="/vite.svg" className="w-10 h-10" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src="/src/assets/react.svg" className="w-10 h-10" alt="React logo" />
        </a>
      </div>
    </main>
  )
}
