import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { DrinkResult } from '@/types/game'

// ダミー画像（後で差し替え）
import drinkImg from '@/assets/drink_dummy.png'

// そのプレイヤーの DrinkResult を引く
function findResult(drinks: DrinkResult[], playerId: string) {
  return drinks.find((d) => d.playerId === playerId) ?? null
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function finalTheme(final: number) {
  // 0: セーフ（緑）
  if (final <= 0) {
    return {
      accentText: 'text-emerald-700',
      glow: 'bg-emerald-300/35',
      badge: 'bg-emerald-600 text-white',
    }
  }

  // 1-2: ライト（青）
  if (final <= 2) {
    return {
      accentText: 'text-sky-700',
      glow: 'bg-sky-300/35',
      badge: 'bg-sky-600 text-white',
    }
  }

  // 3-4: ハード（黄）
  if (final <= 4) {
    return {
      accentText: 'text-amber-800',
      glow: 'bg-amber-300/45',
      badge: 'bg-amber-600 text-white',
    }
  }

  // 5+: デンジャー（赤・現状維持）
  return {
    accentText: 'text-red-900',
    glow: 'bg-red-400/45',
    badge: 'bg-red-700 text-white',
  }
}

function formatSigned(n: number) {
  if (n > 0) return `+${n}`
  return `${n}`
}

export default function RollPage() {
  const { game, players, runRollPhaseForPlayer } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  // Roll対象（phasePlayerIndex を優先）
  const rollingIndex = game.phasePlayerIndex ?? 0
  const rollingPlayer = players[rollingIndex] ?? null
  const rollingPlayerId = rollingPlayer?.id ?? null

  const result = useMemo(() => {
    if (!rollingPlayerId) return null
    return findResult(game.currentDrinks, rollingPlayerId)
  }, [game.currentDrinks, rollingPlayerId])

  const alreadyRolled = !!result

  const handleRoll = () => {
    if (game.phase !== 'roll') return
    if (!rollingPlayer) return
    if (alreadyRolled) return
    runRollPhaseForPlayer(rollingIndex)
  }

  const finalValue = result?.final ?? 0
  const theme = finalTheme(finalValue)

  // 光の強さ（finalに応じて少しだけ変える）
  const glowStrength = clamp(finalValue, 0, 6)
  const glowBlur = 18 + glowStrength * 4 // 18〜42

  const ICON_SIZE = 220

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pt-4 pb-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-semibold text-sky-500">STEP 4 / Roll</p>
              <h1 className="text-lg font-bold text-slate-900">杯数を抽選しよう</h1>
            </div>

            {activePlayer && (
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white">
                代表: {activePlayer.name}
              </div>
            )}
          </div>

          {/* 説明文：折り返し＆左寄せ */}
          <p className="text-left text-xs leading-relaxed text-slate-600">
            アイコンをタップして、このプレイヤーの杯数を抽選します。
          </p>
        </header>

        {/* Main：主役を中央 */}
        <main className="mt-6 flex flex-col items-center justify-center gap-5">
          {/* 対象プレイヤー */}
          <div className="w-full max-w-[520px]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500">抽選するプレイヤー</p>
              <span className="rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {alreadyRolled ? '抽選済' : '未抽選'}
              </span>
            </div>

            <div className="mt-2 flex items-end justify-between">
              <p className="text-xl font-extrabold text-slate-900">
                {rollingPlayer ? rollingPlayer.name : '（プレイヤー未設定）'}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                {rollingPlayer ? `Li: ${rollingPlayer.Li}` : ''}
              </p>
            </div>
          </div>

          {/* 未抽選：お酒アイコン（主役） */}
          {!alreadyRolled && (
            <>
              <button
                type="button"
                onClick={handleRoll}
                disabled={game.phase !== 'roll'}
                className="
                  group relative flex items-center justify-center
                  rounded-[28px]
                  transition-transform duration-150
                  hover:scale-[1.02] active:scale-95
                  disabled:cursor-default disabled:opacity-70
                  outline-none focus-visible:outline-none
                "
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                aria-label="杯数を抽選"
              >
                <div className="absolute inset-0 rounded-[28px] bg-white/35 blur-xl" />
                <img
                  src={drinkImg}
                  alt="杯数抽選"
                  className="relative z-10 h-full w-full select-none object-contain"
                  draggable={false}
                />
              </button>

              <div className="w-full max-w-[420px] px-1">
                <p className="text-left text-xs leading-relaxed text-slate-600">
                  まだ抽選していません。お酒アイコンをタップして抽選してください。
                </p>
              </div>
            </>
          )}

          {/* 抽選済：結果を主役表示（アイコンは出さない） */}
          {alreadyRolled && result && (
            <div className="w-full max-w-[520px]">
              {/* 光（最小限） */}
              <div className="relative">
                <div
                  className={['absolute -inset-2 rounded-[28px]', theme.glow].join(' ')}
                  style={{ filter: `blur(${glowBlur}px)` }}
                />

                <div className="relative">
                  {/* final（大きく） */}
                  <p className="text-center text-[11px] font-semibold text-slate-500">
                    最終杯数
                  </p>

                  <div className="mt-2 flex items-end justify-center gap-3">
                    <span className={['text-6xl font-black tracking-tight', theme.accentText].join(' ')}>
                      {result.final}
                    </span>
                    <span className="pb-2 text-sm font-bold text-slate-600">杯</span>
                  </div>

                  {/* 危険度バッジ的な演出（任意） */}
                  <div className="mt-3 flex justify-center">
                    <span className={['rounded-full px-4 py-1 text-[11px] font-extrabold', theme.badge].join(' ')}>
                      {result.final <= 0
                        ? 'セーフ'
                        : result.final <= 2
                        ? 'ライト'
                        : result.final <= 4
                        ? 'ハード'
                        : 'デンジャー'}
                    </span>
                  </div>

                  {/* 内訳：折り返し＆左寄せ */}
                  <div className="mt-5 mx-auto max-w-[420px] px-1">
                    <p className="text-left text-[11px] font-semibold text-slate-500">
                      内訳
                    </p>

                    <div className="mt-2 space-y-2 text-sm text-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">base</span>
                        <span className="font-semibold">{result.base}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">moodMod</span>
                        <span className="font-semibold">{formatSigned(result.moodMod)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">eventMod</span>
                        <span className="font-semibold">{formatSigned(result.eventMod)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">passiveMod</span>
                        <span className="font-semibold">{formatSigned(result.passiveMod)}</span>
                      </div>

                      {'cardMod' in result && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">cardMod</span>
                          <span className="font-semibold">
                            {formatSigned((result as any).cardMod)}
                          </span>
                        </div>
                      )}

                      {/* finalの計算式を軽く示す（邪魔にならない範囲） */}
                      <div className="pt-2 text-left text-[11px] text-slate-500">
                        base {result.base} {' '}
                        + mood {formatSigned(result.moodMod)} {' '}
                        + event {formatSigned(result.eventMod)} {' '}
                        + passive {formatSigned(result.passiveMod)}
                        {'cardMod' in result ? ` + card ${formatSigned((result as any).cardMod)}` : ''}
                        {' '}
                        = final {result.final}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
