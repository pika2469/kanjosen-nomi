// src/components/layout/MainLayout.tsx
import React from 'react'
import type { Direction } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

type MainLayoutProps = {
  children: React.ReactNode
  footerVariant?: 'default' | 'game'
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  footerVariant = 'default',
}) => {
  const {
    ui,
    game,
    players,
    setPage,
    spinMood,
    proceedPhase,
  } = useGameStore()

  const isActive = (page: string) => ui.currentPage === page

  // ★ ここをゲームロジック込みの「進む」に差し替え
  const handleGameNext = () => {
    const current = ui.currentPage

    switch (current) {
      case 'mood': {
        // ムード未決定なら1回回してからフェーズ進行
        if (!game.mood) {
          spinMood()
        }
        proceedPhase()          // phase: mood -> station
        setPage('station')
        break
      }

      case 'station': {
        const state = useGameStore.getState()
        const { game, runStationPhase, setPhase, setPage } = state
        
        // まだ駅が決まっていなければここで決定
        if (game.lastStationSteps == null || game.lastStationDirection == null) {
          const steps = Math.floor(Math.random() * 6) + 1
          const direction: Direction =
            Math.random() < 0.5 ? 'cw' : 'ccw'
          runStationPhase(steps, direction)
        }

        // 駅イベントページへ
        setPhase('stationEvent')
        setPage('stationEvent')
        break
      }

      case 'stationEvent': {
        // 駅イベント → 杯数ロールへ
        proceedPhase()          // phase: stationEvent -> roll
        setPage('roll')
        break
      }

      case 'roll': {
        // 代表プレイヤー or phasePlayerIndex のプレイヤーの杯数ロールが行われる
        proceedPhase()          // phase: roll -> draw（内部で runRollPhaseForPlayer 実行）
        setPage('draw')
        break
      }

      case 'draw': {
        // いま何人目を処理中かで、次が「次の人の roll」か「useCards」かを分岐
        const idx = game.phasePlayerIndex ?? 0
        const count = players.length
        const isLastPlayer = idx + 1 >= count

        proceedPhase()          // phase: draw -> roll(次の人) or useCards(全員終了)

        setPage(isLastPlayer ? 'useCards' : 'roll')
        break
      }

      case 'useCards': {
        // カード使用フェーズもプレイヤー順に回す
        const idx = game.phasePlayerIndex ?? 0
        const count = players.length
        const isLastPlayer = idx + 1 >= count

        proceedPhase()          // phase: useCards -> useCards(次の人) or progress

        setPage(isLastPlayer ? 'progress' : 'useCards')
        break
      }

      case 'progress': {
        // 成長判定 → 結果表示へ
        proceedPhase()          // phase: progress -> result（内部で runProgressPhase）
        setPage('result')
        break
      }

      case 'result': {
        // 結果表示 → 次のターンのムードへ
        proceedPhase()          // phase: result -> mood（内部で nextTurn）
        setPage('mood')
        break
      }

      default:
        break
    }
  }

  return (
    <div className="h-screen w-full">
      {/* 内側は max-w-width の枠だが背景色は付けない */}
      <div className="mx-auto flex h-full w-full max-w-md flex-col">

        {/* 上部ヘッダー */}
        <header className="px-4 pt-6 pb-3">
          <div className="text-lg font-semibold text-slate-800">
            環状線飲みアプリ
          </div>
          <div className="text-[10px] text-slate-400">ver 1.5</div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto px-4 pb-24">
          {children}
        </main>

        {/* 下部ナビゲーション */}
        {footerVariant === 'default' ? (
          // 通常版：6ボタン nav（Home / Debug / Settings / Roulette / Cards / Result）
           <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 bg-white/95 px-3 py-4 shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPage('home')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('home')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setPage('debug')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('debug')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Debug
              </button>
              <button
                type="button"
                onClick={() => setPage('settings')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('settings')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Settings
              </button>

              <button
                type="button"
                onClick={() => setPage('mood')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('mood')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Roulette
              </button>
              <button
                type="button"
                onClick={() => setPage('cardHand')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('cardHand')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setPage('result')}
                className={
                  'w-full rounded-xl px-3 py-2 font-medium ' +
                  (isActive('result')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
                }
              >
                Result
              </button>
            </div>
          </nav>
        ) : (
          // ゲーム版：3ボタン nav（Homeへ / Debug / 進む）
           <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setPage('home')}
                className="w-full rounded-full bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300"
              >
                Homeへ
              </button>
              <button
                onClick={() => setPage('debug')}
                className="w-full rounded-full bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300"
              >
                Debug
              </button>
              <button
                onClick={handleGameNext}
                className="w-full rounded-full bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                進む
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}