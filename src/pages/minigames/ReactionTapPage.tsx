import { useEffect, useMemo, useRef, useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'
import { useGameStore } from '@/store/gameStore'

type Phase = 'idle' | 'waiting' | 'go' | 'done' | 'false'

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

export default function ReactionTapPage() {
  const { setPage, game, players } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const [phase, setPhase] = useState<Phase>('idle')
  const [resultMs, setResultMs] = useState<number | null>(null)

  const goAtRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const start = () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    setResultMs(null)
    setPhase('waiting')
    goAtRef.current = null

    const waitMs = randInt(800, 2500)
    timerRef.current = window.setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase('go')
      timerRef.current = null
    }, waitMs)
  }

  const onTap = () => {
    if (phase === 'waiting') {
      // 早押し
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
      timerRef.current = null
      setPhase('false')
      setResultMs(null)
      return
    }
    if (phase === 'go') {
      const goAt = goAtRef.current
      if (!goAt) return
      const ms = Math.max(0, Math.round(performance.now() - goAt))
      setResultMs(ms)
      setPhase('done')
    }
  }

  const panelClass = useMemo(() => {
    if (phase === 'go') return 'bg-emerald-500/90 ring-emerald-200'
    if (phase === 'false') return 'bg-rose-500/90 ring-rose-200'
    return 'bg-white/75 ring-black/5'
  }, [phase])

  const title = useMemo(() => {
    if (phase === 'idle') return 'スタートを押してください'
    if (phase === 'waiting') return '光るまで待って…'
    if (phase === 'go') return '今だ！タップ！'
    if (phase === 'false') return '早押し！'
    return '結果'
  }, [phase])

  return (
    <PageShell
      step="MINIGAME / Reaction"
      title="反射神経テスト"
      description="光った瞬間にタップ。反応速度を計測します。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex min-h-full flex-col gap-4">
        <section
          className={[
            'rounded-3xl p-4 shadow-md ring-1',
            'transition-colors duration-200',
            panelClass,
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">状態</p>
            <button
              type="button"
              className="rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-900/15"
              onClick={() => setPage('minigame')}
            >
              Hubへ
            </button>
          </div>

          <div className="mt-4 rounded-3xl bg-white/35 p-4 ring-1 ring-white/30">
            <button
              type="button"
              onClick={onTap}
              className={[
                'w-full rounded-3xl py-10 text-center',
                'font-extrabold tracking-tight',
                'transition-transform active:scale-[0.99]',
                phase === 'go'
                  ? 'bg-white/20 text-white'
                  : phase === 'false'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/70 text-slate-900',
              ].join(' ')}
            >
              <div className="text-2xl">{title}</div>
              {phase === 'done' && resultMs != null && (
                <div className="mt-3 text-4xl">
                  {resultMs}
                  <span className="ml-1 text-xl">ms</span>
                </div>
              )}
              {phase === 'false' && (
                <div className="mt-3 text-sm font-semibold">
                  光ってからタップしてください
                </div>
              )}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={start}
              className="footer-btn w-full"
            >
              スタート
            </button>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current != null) window.clearTimeout(timerRef.current)
                timerRef.current = null
                setPhase('idle')
                setResultMs(null)
                goAtRef.current = null
              }}
              className="footer-btn w-full bg-white/70"
            >
              リセット
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            ※ 早押しすると失敗扱いになります。
          </p>
        </section>

        <StickyNextBar
          label="Hubへ戻る"
          onNext={() => setPage('minigame')}
        />
      </div>
    </PageShell>
  )
}
