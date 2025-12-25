import { useEffect, useMemo, useRef, useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'
import { useGameStore } from '@/store/gameStore'

type Phase = 'idle' | 'running' | 'win' | 'lose'

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function pickUniqueIndices(count: number, maxExclusive: number): number[] {
  const set = new Set<number>()
  while (set.size < count) set.add(randInt(0, maxExclusive - 1))
  return Array.from(set)
}

export default function FakeButtonPage() {
  const { setPage, game, players } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const GRID = 16 // 4x4
  const [phase, setPhase] = useState<Phase>('idle')

  const [fakeSet, setFakeSet] = useState<Set<number>>(new Set())
  const [opened, setOpened] = useState<Set<number>>(new Set())
  const [picked, setPicked] = useState<number | null>(null)

  // 演出用
  const [flipKey, setFlipKey] = useState(0) // start/restartで裏面へ戻す＆アニメ再起動
  const [showConfetti, setShowConfetti] = useState(false)

  // クリック連打でのレース回避（安全策）
  const lockedRef = useRef(false)

  useEffect(() => {
    lockedRef.current = false
  }, [phase])

  // 勝利時に紙吹雪を短時間表示
  useEffect(() => {
    if (phase !== 'win') return
    setShowConfetti(true)
    const t = window.setTimeout(() => setShowConfetti(false), 900)
    return () => window.clearTimeout(t)
  }, [phase])

  const fakeCount = fakeSet.size
  const safeTotal = GRID - fakeCount

  const openedSafeCount = useMemo(() => {
    let n = 0
    opened.forEach((i) => {
      if (!fakeSet.has(i)) n += 1
    })
    return n
  }, [opened, fakeSet])

  const start = () => {
    const nFake = randInt(2, 4)
    // const nFake = 2
    const indices = pickUniqueIndices(nFake, GRID)

    setFakeSet(new Set(indices))
    setOpened(new Set())
    setPicked(null)
    setPhase('running')

    // ★ 全カードを「裏面」に戻す演出リセット
    setFlipKey((k) => k + 1)
  }

  const reset = () => {
    setPhase('idle')
    setFakeSet(new Set())
    setOpened(new Set())
    setPicked(null)
    setShowConfetti(false)
    setFlipKey((k) => k + 1) // idleに戻しても裏面に統一
  }

  const onPick = (i: number) => {
    if (phase !== 'running') return
    if (lockedRef.current) return
    if (opened.has(i)) return

    lockedRef.current = true
    setPicked(i)

    const isFake = fakeSet.has(i)

    setOpened((prev) => {
      const next = new Set(prev)
      next.add(i)
      return next
    })

    if (isFake) {
      setPhase('lose')
      return
    }

    // 〇だった場合：全部開いたら勝利
    const nextOpenedSafe = openedSafeCount + 1
    if (nextOpenedSafe >= safeTotal) {
      setPhase('win')
    } else {
      lockedRef.current = false
    }
  }

  const statusText = useMemo(() => {
    if (phase === 'idle') return 'スタートで開始'
    if (phase === 'running') return '✖を引いたら終了。〇をめくれ！'
    if (phase === 'win') return 'クリア！'
    return 'ゲームオーバー…'
  }, [phase])

  const subText = useMemo(() => {
    if (phase === 'idle') return '偽物（✖）が2枚含まれています。'
    if (phase === 'running') return `進捗：${openedSafeCount}/${safeTotal}（〇）`
    if (phase === 'win') return `全ての〇をめくりました！（✖：${fakeCount}枚）`
    return picked != null && fakeSet.has(picked) ? '✖を引きました。' : '終了しました。'
  }, [phase, openedSafeCount, safeTotal, fakeCount, picked, fakeSet])

  // ★ idle/running は「裏面のみ」：結果が出たら全公開
  const revealAll = phase === 'win' || phase === 'lose'

  return (
    <PageShell
      step="MINIGAME / Fake"
      title="フェイクカードゲーム"
      description="4×4のカードをめくります。✖を引いたら即終了。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex min-h-full flex-col gap-4">
        <section
          className={[
            'relative overflow-hidden rounded-3xl bg-white/80 p-4 shadow-md ring-1 ring-black/5',
            phase === 'lose' ? 'ks-lose-pulse' : '',
            phase === 'win' ? 'ks-win-glow' : '',
          ].join(' ')}
        >
          {/* 紙吹雪（勝利時のみ短時間） */}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 18 }).map((_, idx) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className="ks-confetti"
                  style={{
                    left: `${randInt(10, 90)}%`,
                    top: `-8%`,
                    animationDelay: `${randInt(0, 180)}ms`,
                    // サイズ揺らぎ
                    width: `${randInt(5, 8)}px`,
                    height: `${randInt(8, 12)}px`,
                    transform: `rotate(${randInt(-40, 40)}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">{statusText}</p>
            <button
              type="button"
              className="rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-900/15"
              onClick={() => setPage('minigame')}
            >
              Hubへ
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">{subText}</p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: GRID }).map((_, i) => {
              const isOpened = opened.has(i)
              const isFake = fakeSet.has(i)
              const isPicked = picked === i

              // 表を見せる条件：開いた or 終了後公開
              const showFace = isOpened || revealAll

              // 状態別の“表”色
              const faceCls = revealAll
                ? isFake
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
                : isOpened
                  ? isFake
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : ''

              // 失敗時は、選んだ✖だけ強く揺らす
              const loseShake = phase === 'lose' && isPicked && isFake ? 'ks-lose-shake' : ''

              // “カード”は表裏を2レイヤーで作る（フリップ）
              return (
                <button
                  key={`${flipKey}-${i}`}
                  type="button"
                  onClick={() => onPick(i)}
                  disabled={phase !== 'running' || isOpened}
                  className={[
                    'relative h-[64px] rounded-2xl',
                    'transition-transform active:scale-[0.98]',
                    'outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30',
                    loseShake,
                  ].join(' ')}
                  aria-label={`card-${i}`}
                >
                  <div
                    className={[
                      'absolute inset-0 rounded-2xl',
                      'ring-1 ring-black/5',
                      'ks-card3d',
                      showFace ? 'ks-flip-show' : 'ks-flip-hide',
                    ].join(' ')}
                  >
                    {/* 裏面 */}
                    <div className="ks-card-face ks-card-back">
                      <img 
                        src="/cards/back.png"
                        alt=""
                        draggable={false}
                        className="h-full w-full rounded-2xl object-cover select-none"
                      />
                    </div>

                    {/* 表面 */}
                    <div
                      className={[
                        'ks-card-face ks-card-front',
                        faceCls,
                        // 最後に選んだカードのリング
                        isPicked ? 'ring-2 ring-slate-900/30' : '',
                      ].join(' ')}
                    >
                      <span className="text-base font-extrabold">
                        {showFace ? (isFake ? '✖' : '〇') : ''}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={start} className="footer-btn w-full">
              {phase === 'running' ? '再スタート' : 'スタート'}
            </button>
            <button type="button" onClick={reset} className="footer-btn w-full bg-white/70">
              リセット
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">※ 〇をどこまでめくれるか挑戦してください。</p>

          {/* ここから下は、このページ専用の演出CSS（局所化） */}
          <style>{`
            /* ===== Flip card ===== */
            .ks-card3d {
              transform-style: preserve-3d;
              transition: transform 420ms cubic-bezier(.2,.8,.2,1);
              will-change: transform;
            }
            .ks-card-face {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 16px;
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
            }

            /* 裏面デザイン */
            .ks-card-back {
              border: 1px solid rgba(15,23,42,0.08);
              box-shadow: 0 10px 26px rgba(2,6,23,0.10);
            }

            /* 表面 */
            .ks-card-front {
              transform: rotateY(180deg);
              border: 1px solid rgba(255,255,255,0.28);
              box-shadow: 0 10px 26px rgba(2,6,23,0.10);
            }

            /* show/hide でフリップ */
            .ks-flip-hide { transform: rotateY(0deg); }
            .ks-flip-show { transform: rotateY(180deg); }

            /* ===== Win confetti ===== */
            .ks-confetti {
              position: absolute;
              background: rgba(15, 23, 42, 0.18);
              border-radius: 2px;
              animation: ksConfettiFall 900ms cubic-bezier(.2,.8,.2,1) both;
            }
            @keyframes ksConfettiFall {
              0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
              10%  { opacity: 1; }
              100% { transform: translate3d(0, 120%, 0) rotate(220deg); opacity: 0; }
            }
            .ks-win-glow {
              box-shadow: 0 0 0 1px rgba(16,185,129,0.16), 0 18px 60px rgba(16,185,129,0.10);
            }

            /* ===== Lose emphasis ===== */
            .ks-lose-pulse {
              animation: ksLosePulse 520ms cubic-bezier(.2,.8,.2,1) both;
            }
            @keyframes ksLosePulse {
              0%   { box-shadow: 0 0 0 rgba(244,63,94,0); }
              30%  { box-shadow: 0 0 0 6px rgba(244,63,94,0.14); }
              100% { box-shadow: 0 0 0 rgba(244,63,94,0); }
            }
            .ks-lose-shake {
              animation: ksLoseShake 520ms cubic-bezier(.2,.8,.2,1) both;
            }
            @keyframes ksLoseShake {
              0%   { transform: translate3d(0,0,0); }
              18%  { transform: translate3d(-4px,0,0) rotate(-2deg); }
              36%  { transform: translate3d(4px,0,0) rotate(2deg); }
              54%  { transform: translate3d(-3px,0,0) rotate(-1.5deg); }
              72%  { transform: translate3d(3px,0,0) rotate(1.5deg); }
              100% { transform: translate3d(0,0,0); }
            }

            @media (prefers-reduced-motion: reduce) {
              .ks-card3d { transition: none; }
              .ks-lose-pulse, .ks-lose-shake, .ks-confetti { animation: none; }
            }
          `}</style>
        </section>

        <StickyNextBar label="Hubへ戻る" onNext={() => setPage('minigame')} />
      </div>
    </PageShell>
  )
}
