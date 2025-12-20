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
    setPhase,
    runStationPhase,
    runRollPhaseForPlayer,
    setPhasePlayerIndex,
    drawCard,
  } = useGameStore()

  const isActive = (page: string) => ui.currentPage === page

  const page = ui.currentPage

  // ゲームフェーズ進行ページ（StationPageなど）
  const isGamePage = [
    'mood',
    'station',
    'stationEvent',
    'roll',
    'draw',
    'useCards',
    'progress',
    'result',
    'passives',
  ].includes(page)

  const isSettingsPage = page === 'settings'
  const isHomePage = page === 'home'
  const showFooter = !isHomePage

  // ★FAB(次へ)は「実際の進行フェーズ」のみに限定
  const isPhaseProgressPage = [
    'mood',
    'station',
    'stationEvent',
    'roll',
    'draw',
    'useCards',
    'progress',
    'result',
  ].includes(page)

  // ★ ここをゲームロジック込みの「進む」に差し替え（現行踏襲）
  const handleGameNext = () => {
    const current = ui.currentPage

    switch (current) {
      case 'mood': {
        if (!game.mood) {
          spinMood()
        }
        proceedPhase() // phase: mood -> station
        setPage('station')
        break
      }

      case 'station': {
        if (game.lastStationSteps == null || game.lastStationDirection == null) {
          const steps = Math.floor(Math.random() * 6) + 1
          const direction: Direction = Math.random() < 0.5 ? 'cw' : 'ccw'
          runStationPhase(steps, direction)
        }

        setPhase('stationEvent')
        setPage('stationEvent')
        break
      }

      case 'stationEvent': {
        proceedPhase() // phase: stationEvent -> roll
        setPage('roll')
        break
      }

      case 'roll': {
        const idx = game.phasePlayerIndex ?? 0
        const p = players[idx]
        if (!p) break

        const rolled = game.currentDrinks.some((d) => d.playerId === p.id)
        if (!rolled) {
          runRollPhaseForPlayer(idx)
        }

        setPhase('draw')
        setPhasePlayerIndex(idx)
        setPage('draw')
        break
      }

      case 'draw': {
        const idx = game.phasePlayerIndex ?? 0
        const p = players[idx]
        if (!p) break

        const alreadyDrawn = (game.drawnPlayerIds ?? []).includes(p.id)

        if (!alreadyDrawn) {
          drawCard(p.id)
        }

        if (idx + 1 < players.length) {
          setPhase('roll')
          setPhasePlayerIndex(idx + 1)
          setPage('roll')
        } else {
          setPhase('useCards')
          setPhasePlayerIndex(0)
          setPage('useCards')
        }

        break
      }

      case 'useCards': {
        const idx = game.phasePlayerIndex ?? 0
        const count = players.length
        const isLastPlayer = idx + 1 >= count

        proceedPhase() // phase: useCards -> useCards(次の人) or progress
        setPage(isLastPlayer ? 'progress' : 'useCards')
        break
      }

      case 'progress': {
        proceedPhase() // phase: progress -> result（内部で runProgressPhase）
        setPage('result')
        break
      }

      case 'result': {
        proceedPhase() // phase: result -> mood（内部で nextTurn）
        setPage('mood')
        break
      }

      default:
        break
    }
  }

  return (
    <div
      className="h-screen w-full"
      style={
        {
          // フッター高さ（固定）
          '--footer-h': '6.25rem',
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col min-h-0">
        {/* 上部ヘッダー */}
        <header className={['px-4 pb-4 pt-[calc(env(safe-area-inset-top)+50px)]',
                  isHomePage ? 'absolute left-0 right-0 top-0 z-20': ''
        ].join(' ')}>
          <div className="text-xl font-bold text-slate-800">
            環状線飲みアプリ
          </div>
          <div className="mt-1 text-[11px] text-slate-400">ver 1.6</div>
        </header>

        {/* メインコンテンツ */}
        <main
          className={[
            'flex-1 min-h-0 px-4',
            isHomePage
              ? 'overflow-hidden overscroll-none flex items-center justify-center'
              : 'overflow-y-auto',
            showFooter ? 'pb-[calc(var(--footer-h)+env(safe-area-inset-bottom))]' : 'pb-0',
            ].join(' ')}
          >
            {children}
          </main>


        {/* ゲーム進行用FAB（フッター外） */}
        {isPhaseProgressPage && (
          <button
            type="button"
            onClick={handleGameNext}
            className="
              fixed right-4 z-20
              bottom-[calc(var(--footer-h)+16px)]
              rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white
              shadow-lg transition
              hover:bg-green-700 active:scale-95
            "
          >
            次へ
          </button>
        )}

        {/* 下部フッター */}
        {showFooter && (
          <>
            {isSettingsPage ? (
          // Settings：Homeのみ
          <nav className="fixed bottom-0 left-1/2 z-10 w-full -translate-x-1/2 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-1 gap-2 text-xs">
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
            </div>
          </nav>
        ) : isGamePage ? (
          // ゲーム進行ページ：Home + Settings のみ
          <nav className="fixed bottom-0 left-1/2 z-10 w-full -translate-x-1/2 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPage('home')}
                className="w-full rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-800 hover:bg-slate-200"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setPage('settings')}
                className="w-full rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-800 hover:bg-slate-200"
              >
                Settings
              </button>
            </div>
          </nav>
        ) : (
          // それ以外のページ：現時点では従来どおり（未検討のため触れない）
          // ※ご要望により miniGameHub 等の構造は現段階で詰めない
          footerVariant === 'default' ? (
            <nav className="fixed bottom-0 left-1/2 z-10 w-full -translate-x-1/2 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
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
            <nav className="fixed bottom-0 left-1/2 z-10 w-full -translate-x-1/2 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(15,23,42,0.12)]">
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
          )
        )}
          
          
          </>
        )}
        
      </div>
    </div>
  )
}
