// import { useState } from "react"
import { useEffect } from "react"
import { useGameStore } from '@/store/gameStore'
import "./index.css"                              // Tailwind を反映
import "./App.css"                                // 既存CSSも読み込み（任意）

import { HomePage } from '@/pages/HomePage' 
import { MainLayout } from '@/components/layout/MainLayout'
import { TurnPage } from '@/pages/TurnPage'
import { RoulettePage } from '@/pages/RoulettePage'
import { CardHandPage } from '@/pages/CardHandPage'
import { ResultPage } from '@/pages/ResultPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MiniGameHubPage } from '@/pages/MiniGameHubPage'
import { PassivesPages } from '@/pages/PassivesPage'

// コンポーネント本体の宣言
export default function App() {
  const { bootstrap, ui } = useGameStore()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  let content = null

  switch (ui.currentPage) {
    case 'home':
      content = <HomePage />
      break
    case 'turn':
      content = <TurnPage />
      break    
    case 'roulette':
      content = <RoulettePage />
      break
    case 'cardHand':
      content = <CardHandPage />
      break
    case 'result':
      content = <ResultPage />
      break
    case 'settings':
      content = <SettingsPage />
      break
    case 'minigame':
      content = <MiniGameHubPage />
      break
    case 'passives':
      content = <PassivesPages />
      break
    default:
      content = <HomePage />
  }

  // JSX (画面描画)
  return (
    <MainLayout>{content}</MainLayout>
  )
}
