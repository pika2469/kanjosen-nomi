import type { ReactNode } from 'react'
import { useGameStore } from '@/store/gameStore'

type PageShellProps = {
  step?: string
  title: string
  description?: string
  rightBadgeText?: string
  children: ReactNode
}

export function PageShell({
  step,
  title,
  description,
  rightBadgeText,
  children,
}: PageShellProps) {
  const { game } = useGameStore()

  const turnText =
    typeof game?.turn === 'number' ? `Turn ${game.turn}` : undefined

  const badgeText = [turnText, rightBadgeText].filter(Boolean).join(' / ')

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pt-4 pb-6">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 text-left">
              {step && (
                <p className="text-[11px] font-semibold text-sky-500">{step}</p>
              )}
              <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            </div>

            {badgeText && (
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white">
                {badgeText}
              </div>
            )}
          </div>

          {description && (
            <p className="text-left text-xs leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </header>

        <main className="mt-6">{children}</main>
      </div>
    </div>
  )
}
