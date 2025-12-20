import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MOODS } from '@/constants/mood'
import rouletteImg from '@/assets/mood_roulette_dummy4.png'

// passives.ts と同方式（assetsを置くだけで自動解決）
const MOOD_IMAGE_MODULES = import.meta.glob('../assets/moods/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function getMoodImageSrc(moodId: string | null | undefined): string {
  if (!moodId) return rouletteImg
  const key = `../assets/moods/${moodId}.png`
  const fallback = `../assets/moods/default.png`
  return MOOD_IMAGE_MODULES[key] ?? MOOD_IMAGE_MODULES[fallback] ?? rouletteImg
}

export default function MoodPage() {
  const { game, players, spinMood } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null
  const moodInfo = useMemo(() => MOODS.find((m) => m.id === game.mood) ?? null, [game.mood])

  const isDecided = !!moodInfo
  const moodImg = getMoodImageSrc(game.mood)

  // 決定後の「ふわっと出る」演出用
  const [showResult, setShowResult] = useState(false)
  useEffect(() => {
    if (isDecided) {
      setShowResult(false)
      const t = window.setTimeout(() => setShowResult(true), 20)
      return () => window.clearTimeout(t)
    }
    setShowResult(false)
  }, [isDecided, game.mood])

  // ルーレットとムード画像のサイズを統一
  const ICON_SIZE = 220

  return (
    <div className="flex min-h-full flex-col">
      {/* 背景は MainLayout 管轄：ページ内では付けない */}
      <div className="flex-1 px-4 pt-4 pb-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-semibold text-indigo-500">STEP 1 / Mood</p>
              <h1 className="text-lg font-bold text-slate-900">ムードを決めよう</h1>
            </div>

            {activePlayer && (
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white">
                代表: {activePlayer.name}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600">このターンの雰囲気をルーレットで決定します。</p>
        </header>

        {/* Center Area */}
        <main className="mt-6 flex flex-col items-center justify-center gap-4">
          {/* 未決定：ルーレットのみ */}
          {!isDecided && (
            <>
              <button
                type="button"
                onClick={spinMood}
                className="
                  group relative flex items-center justify-center
                  rounded-[28px]
                  transition-transform duration-150
                  hover:scale-[1.02] active:scale-95
                  outline-none focus-visible:outline-none
                "
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                aria-label="ムードルーレットを回す"
              >
                {/* 光：背景ではなく“演出”として最小限 */}
                <div className="absolute inset-0 rounded-[28px] bg-white/35 blur-xl" />
                <img
                  src={rouletteImg}
                  alt="ムードルーレット"
                  className="relative z-10 h-full w-full select-none object-contain"
                  draggable={false}
                />
              </button>

              <p className="text-center text-sm font-semibold text-slate-700">
                タップしてムードを決定
              </p>
              <p className="text-center text-xs text-slate-500">
                ルーレットを回すと次のフェーズへ進めます。
              </p>
            </>
          )}

          {/* 決定後：ムード画像（同サイズ）＋テキストは下（説明は左寄せ） */}
          {isDecided && moodInfo && (
            <div className="flex w-full flex-col items-center">
              {/* 画像（中央） */}
              <div
                className={[
                  'relative',
                  'transition-all duration-300 ease-out',
                  showResult ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]',
                ].join(' ')}
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
              >
                <div className="absolute inset-0 rounded-[28px] bg-white/35 blur-xl" />
                <div className="relative z-10 h-full w-full overflow-hidden rounded-[28px]">
                  <img
                    src={moodImg}
                    alt="ムードイラスト"
                    className="h-full w-full select-none object-cover"
                    draggable={false}
                  />
                </div>
              </div>

              {/* テキスト */}
              <div
                className={[
                  'mt-5 w-full max-w-[520px]',
                  'transition-all duration-300 ease-out',
                  showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <p className="text-center text-[11px] font-semibold text-slate-500">
                  抽選結果
                </p>

                {/* iconは廃止：labelのみ */}
                <p className="mt-2 text-center text-2xl font-extrabold text-indigo-700">
                  {moodInfo.label}
                </p>

                {/* 説明文：折り返し & 左寄せ（中央の中で左寄せ） */}
                {moodInfo.description && (
                  <div className="mt-3 mx-auto max-w-[360px] px-1">
                    <p className="text-left text-sm leading-relaxed text-slate-700">
                      {moodInfo.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
