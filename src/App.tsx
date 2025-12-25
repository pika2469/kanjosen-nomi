import React from 'react'
import { useEffect } from "react"
import { useGameStore } from '@/store/gameStore'
import "./index.css"                              // Tailwind を反映
import "./App.css"                                // 既存CSSも読み込み（任意）

// 共通ページ設定
import { MainLayout } from '@/components/layout/MainLayout'

// フェーズ進行ページ
import { HomePage } from '@/pages/HomePage' 
import MoodPage from '@/pages/MoodPage'
import StationPage from '@/pages/StationPage'
import StationEventPage from '@/pages/StationEventPage'
import RollPage from '@/pages/RollPage'
import DrawPage from '@/pages/DrawPage'
import UseCardsPage from '@/pages/UseCardsPage'
import ProgressPage from '@/pages/ProgressPage'
import { ResultPage } from '@/pages/ResultPage'

// ミニゲームページ
import { MiniGameHubPage } from '@/pages/MiniGameHubPage'
import { MiniGameShoubuReturnPage } from '@/pages/minigames/MiniGameShoubuReturnPage'
import ReactionTapPage from '@/pages/minigames/ReactionTapPage'
import MashPage from '@/pages/minigames/MashPage'
import FakeButtonPage from '@/pages/minigames/FakeButtonPage'

// その他ページ
import { SettingsPage } from '@/pages/SettingsPage'
import { TurnPage } from '@/pages/TurnPage' // デバッグページ

// 未使用ページ
import PassivesPages from '@/pages/PassivesPage'
import { RoulettePage } from '@/pages/RoulettePage' // MoodPageに置き換え予定
import { CardHandPage } from '@/pages/CardHandPage'

// コンポーネント本体の宣言
export default function App() {
  const { bootstrap, ui } = useGameStore()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  let content: React.ReactNode

  switch (ui.currentPage) {
    case 'home':
      content = <HomePage />
      break

    case 'debug':
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
    
    case 'minigame_shoubu_return':
      content = <MiniGameShoubuReturnPage />
      break

    case 'minigame_reaction':
      content = <ReactionTapPage />
      break
      
    case 'minigame_mash':
      content = <MashPage />
      break

    case 'minigame_fake':
      content = <FakeButtonPage />
      break

    case 'passives':
      content = <PassivesPages />
      break

    // --- ゲーム進行ページ ---
    case 'mood':
      content = <MoodPage />
      break

    case 'station':
      content = <StationPage />
      break

    case 'stationEvent':
      content = <StationEventPage />
      break

    case 'roll':
      content = <RollPage />
      break

    case 'draw':
      content = <DrawPage />
      break

    case 'useCards':
      content = <UseCardsPage />
      break

    case 'progress':
      content = <ProgressPage />
      break

    // ------------------------------------------
    default:
      content = <HomePage />
      break
  }

  // ゲーム進行ページかどうかで nav の種類を切り替え
  const gamePages = [
    'mood',
    'station',
    'stationEvent',
    'roll',
    'draw',
    'useCards',
    'progress',
    'result',
  ] as const

  const footerVariant: 'default' | 'game' =
    (gamePages as readonly string[]).includes(ui.currentPage)
      ? 'game'
      : 'default'

  return (
    <MainLayout footerVariant={footerVariant}>
      {content}
    </MainLayout>
  )
}
