// src/pages/StationPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import stationDiceImg from '@/assets/station_dice_dummy3.png'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'

export default function StationPage() {
  const {
    game,
    players,
    decideStationAndGoNext,
    ensureStationEventPhase,
    isStationDecided,
    proceedPhase,
  } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  // 駅決定済でStationPageが開かれたら、自動で次フェーズへ
  useEffect(() => {
    ensureStationEventPhase()
  }, [ensureStationEventPhase])

  const decided = isStationDecided()

  // ★ 追加：サイコロ演出用
  const [rolling, setRolling] = useState(false)
  const tRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (tRef.current != null) window.clearTimeout(tRef.current)
    }
  }, [])

  const handleTapDice = () => {
    if (rolling) return
    if (decided || game.phase !== 'station') return

    setRolling(true)
    tRef.current = window.setTimeout(() => {
      decideStationAndGoNext()
      setRolling(false)
      tRef.current = null
    }, 450)
  }

  const ICON_SIZE = 220

  return (
    <PageShell
      step="STEP 2 / Station"
      title="駅を決めよう"
      description="サイコロをタップすると、次の駅（移動距離1〜6駅・方向）が決定され、次のフェーズへ進みます。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleTapDice}
          disabled={decided || rolling || game.phase !== 'station'}
          className="tap-icon group relative flex items-center justify-center disabled:opacity-80"
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
          aria-label="駅を決めるサイコロ"
        >
          <div className="absolute inset-0 rounded-[28px] bg-white/35 blur-xl" />
          <img
            src={stationDiceImg}
            alt="駅決定サイコロ"
            className={[
              'relative z-10 h-full w-full select-none object-contain',
              rolling ? 'ks-anim-shake' : '',
            ].join(' ')}
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

        <StickyNextBar
          onNext={proceedPhase}
          disabled={!decided}
          hint={!decided ? '※ まずサイコロをタップして駅を決定してください。' : undefined}
        />
      </div>
    </PageShell>
  )
}
