import { useEffect, useRef, useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'
import { useGameStore } from '@/store/gameStore'

type Phase = 'idle' | 'running' | 'done'

export default function MashPage() {
  const { setPage, game, players } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(0)
  const [leftMs, setLeftMs] = useState(5000)

  const startAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const tick = () => {
    const startAt = startAtRef.current
    if (!startAt) return
    const elapsed = performance.now() - startAt
    const remain = Math.max(0, 5000 - elapsed)
    setLeftMs(Math.round(remain))
    if (remain <= 0) {
      setPhase('done')
      startAtRef.current = null
      rafRef.current = null
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    setCount(0)
    setLeftMs(5000)
    setPhase('running')
    startAtRef.current = performance.now()
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }

  const onTap = () => {
    if (phase !== 'running') return
    setCount((c) => c + 1)
  }

  return (
    <PageShell
      step="MINIGAME / Mash"
      title="連打チャレンジ（5秒）"
      description="5秒間で何回タップできるかを計測します。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex min-h-full flex-col gap-4">
        <section className="rounded-3xl bg-white/80 p-4 shadow-md ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">スコア</p>
            <button
              type="button"
              className="rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-900/15"
              onClick={() => setPage('minigame')}
            >
              Hubへ
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-black/5">
              <p className="text-[11px] font-semibold text-slate-500">残り</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {phase === 'running' ? (leftMs / 1000).toFixed(1) : '5.0'}s
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] font-semibold text-slate-200">回数</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{count}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTap}
            className={[
              'mt-4 w-full rounded-3xl py-10 text-center text-2xl font-extrabold',
              'transition-transform active:scale-[0.99]',
              phase === 'running'
                ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white'
                : 'bg-slate-100 text-slate-500',
            ].join(' ')}
            disabled={phase !== 'running'}
          >
            {phase === 'running' ? '連打！' : phase === 'done' ? '終了' : '待機中'}
          </button>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={start} className="footer-btn w-full">
              {phase === 'running' ? '再スタート' : 'スタート'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
                rafRef.current = null
                startAtRef.current = null
                setPhase('idle')
                setCount(0)
                setLeftMs(5000)
              }}
              className="footer-btn w-full bg-white/70"
            >
              リセット
            </button>
          </div>
        </section>

        <StickyNextBar label="Hubへ戻る" onNext={() => setPage('minigame')} />
      </div>
    </PageShell>
  )
}
