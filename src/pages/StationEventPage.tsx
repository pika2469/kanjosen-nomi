import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { STATIONS } from '@/stations'
import { STATION_EVENTS } from '@/stationEvents'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'

// イラスト自動解決（passives / moods と同方式）
const EVENT_IMAGE_MODULES = import.meta.glob('../assets/stationEvents/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function getEventImageSrc(illustrationId?: string) {
  if (!illustrationId) return ''
  const key = `../assets/stationEvents/${illustrationId}.png`
  const fallback = `../assets/stationEvents/default.png`
  return EVENT_IMAGE_MODULES[key] ?? EVENT_IMAGE_MODULES[fallback] ?? ''
}

export default function StationEventPage() {
  const { game, players, proceedPhase } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const station = useMemo(
    () => STATIONS.find((s) => s.id === game.currentStation) ?? null,
    [game.currentStation],
  )

  const eventId = game.currentEvent?.id
  const eventDef = eventId ? STATION_EVENTS[eventId] : null
  const eventImg = getEventImageSrc(eventDef?.illustrationId)

  // ふわっと出る演出
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (eventDef) {
      setShow(false)
      const t = setTimeout(() => setShow(true), 20)
      return () => clearTimeout(t)
    }
    setShow(false)
  }, [eventId, eventDef])

  return (
    <PageShell
      step="STEP 3 / Station Event"
      title="駅イベント"
      description="到着した駅の雰囲気によって、このターンの結果が変化します。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-[11px] font-semibold text-slate-500">
          到着した駅
        </p>
        <p className="mt-2 text-center text-2xl font-extrabold text-slate-900">
          {station?.name ?? '駅未決定'}
        </p>

        {eventDef && (
          <div
            className={[
              'mt-6 w-full max-w-[560px]',
              'transition-all duration-300 ease-out',
              show
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-[0.98]',
            ].join(' ')}
          >
            {/* イラスト（主役：16:10 横長） */}
            <div className="mx-auto mb-6 w-full max-w-[640px]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[24px]">
                {/* うっすらした光（箱を作らない方針） */}
                <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-white/30 blur-xl" />

                {eventImg && (
                  <img
                    src={eventImg}
                    alt="駅イベントイラスト"
                    className="relative z-10 h-full w-full select-none object-cover"
                    draggable={false}
                  />
                )}
              </div>
            </div>

            {/* テキスト */}
            <p className="text-center text-xl font-extrabold text-slate-900">
              {eventDef.title}
            </p>

            <p className="mt-2 text-center text-sm font-semibold text-slate-700">
              {eventDef.summary}
            </p>

            <div className="mt-4 mx-auto max-w-[420px] px-1">
              <p className="text-left text-sm leading-relaxed text-slate-700">
                {eventDef.detail}
              </p>
            </div>
          </div>
        )}

        <StickyNextBar
          onNext={proceedPhase}
          disabled={!eventDef}
          hint={!eventDef ? '※ 駅イベントが未確定です。駅決定フェーズからやり直してください。' : undefined}
        />
      </div>
    </PageShell>
  )
}
