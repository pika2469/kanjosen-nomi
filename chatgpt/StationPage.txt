// src/pages/StationPage.tsx
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import stationDiceImg from '@/assets/station_dice_dummy3.png'

export default function StationPage() {
  const {
    game,
    players,
    decideStationAndGoNext,
    ensureStationEventPhase,
    isStationDecided,
  } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  // 駅決定済でStationPageが開かれたら、自動で次フェーズへ
  useEffect(() => {
    ensureStationEventPhase()
  }, [ensureStationEventPhase])

  const decided = isStationDecided()

  const handleTapDice = () => {
    // 未決定なら、決定して次フェーズへ進める
    decideStationAndGoNext()
  }

  const ICON_SIZE = 220

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pt-4 pb-6">
        {/* Header（MoodPage方針：背景はMainLayout管轄／箱を作らない） */}
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-semibold text-sky-500">
                STEP 2 / Station
              </p>
              <h1 className="text-lg font-bold text-slate-900">駅を決めよう</h1>
            </div>

            {activePlayer && (
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white">
                代表: {activePlayer.name}
              </div>
            )}
          </div>

          {/* 説明文：折り返し＆左寄せ（全体方針） */}
          <p className="text-left text-xs leading-relaxed text-slate-600">
            サイコロをタップすると、次の駅（移動距離1〜6駅・方向）が決定され、次のフェーズへ進みます。
          </p>
        </header>

        {/* Main：主役を中央 */}
        <main className="mt-6 flex flex-col items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleTapDice}
            disabled={decided || game.phase !== 'station'}
            className="
              group relative flex items-center justify-center
              rounded-[28px]
              transition-transform duration-150
              hover:scale-[1.02] active:scale-95
              disabled:cursor-default disabled:opacity-80
              outline-none focus-visible:outline-none
            "
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
            aria-label="駅を決めるサイコロ"
          >
            <div className="absolute inset-0 rounded-[28px] bg-white/35 blur-xl" />
            <img
              src={stationDiceImg}
              alt="駅決定サイコロ"
              className="relative z-10 h-full w-full select-none object-contain"
              draggable={false}
            />
          </button>

          {!decided && (
            <div className="w-full max-w-[420px] px-1">
              <p className="text-left text-xs leading-relaxed text-slate-600">
                タップして駅を決定してください。
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
