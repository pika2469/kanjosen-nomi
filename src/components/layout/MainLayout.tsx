// src/components/layout/MainLayout.tsx
import React from 'react'
import { useGameStore } from '@/store/gameStore'
import { Home as HomeIcon, Settings as SettingsIcon } from 'lucide-react'

type MainLayoutProps = {
  children: React.ReactNode
  footerVariant?: 'default' | 'game'
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  footerVariant = 'default', // ※現状は互換のため残す（A-3-2で実質未使用）
}) => {
  const {
    ui,
    setPage,
    proceedPhase, // ※現状は互換のため残す（MainLayout側に進行ボタンは置かない方針）
  } = useGameStore()

  const page = ui.currentPage
  const isHomePage = page === 'home'
  const isSettingsPage = page === 'settings'
  const showFooter = !isHomePage

  // ★ 互換：現状未使用（後で掃除してOK）
  const handleGameNext = () => {
    proceedPhase()
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
        <header
          className={[
            'px-4 pb-4 pt-[calc(env(safe-area-inset-top)+50px)]',
            isHomePage ? 'absolute left-0 right-0 top-0 z-20' : '',
          ].join(' ')}
        >
          <div className="text-xl font-bold text-slate-800">環状線飲みアプリ</div>
          <div className="mt-1 text-[11px] text-slate-400">ver 1.7</div>
        </header>

        {/* メインコンテンツ */}
        <main
          className={[
            'flex-1 min-h-0 px-4',
            isHomePage
              ? 'overflow-visible overscroll-none flex items-center justify-center'
              : 'overflow-y-auto',
            showFooter
              ? 'pb-[calc(var(--footer-h)+env(safe-area-inset-bottom))]'
              : 'pb-0',
          ].join(' ')}
        >
          {/* Homeだけは、fixed/transform/overflowの都合でラップせずアニメ対象外にする */}
          {isHomePage ? (
            children
          ) : (
            <div key={ui.currentPage} className="page-enter">
              {children}
            </div>
          )}
        </main>

        {/* 下部フッター（A-3-1〜A-3-2：ルール統一） */}
        {showFooter && (
          <nav className="app-footer">
            {isSettingsPage ? (
              // Settings：Homeのみ
              <div className="footer-grid-1">
                <button
                  type="button"
                  onClick={() => setPage('home')}
                  className="footer-btn flex items-center justify-center gap-2"
                  aria-label="Home"
                >
                  <HomeIcon size={18} />
                  <span>Home</span>
                </button>
              </div>
            ) : (
              // それ以外：常に Home / Settings
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPage('home')}
                  className="footer-btn flex items-center justify-center gap-2"
                  aria-label="Home"
                >
                  <HomeIcon size={18} />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage('settings')}
                  className="footer-btn flex items-center justify-center gap-2"
                  aria-label="Settings"
                >
                  <SettingsIcon size={18} />
                  <span>Settings</span>                  
                </button>
              </div>
            )}

            {/* footerVariant互換用：現状未使用（後で削除してOK） */}
            {footerVariant === 'game' && (
              <div className="hidden">
                <button type="button" onClick={handleGameNext}>
                  進む
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
