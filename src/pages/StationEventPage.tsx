import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { STATIONS } from '@/stations'
import { STATION_EVENTS } from '@/stationEvents'

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
  const { game, players } = useGameStore()
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
  }, [eventId])

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pt-4 pb-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-semibold text-sky-500">
                STEP 3 / Station Event
              </p>
              <h1 className="text-lg font-bold text-slate-900">駅イベント</h1>
            </div>
            {activePlayer && (
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white">
                代表: {activePlayer.name}
              </div>
            )}
          </div>

          <p className="text-left text-xs leading-relaxed text-slate-600">
            到着した駅の雰囲気によって、このターンの結果が変化します。
          </p>
        </header>

        {/* Main */}
        <main className="mt-6 flex flex-col items-center">
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
              {/* イラスト（主役） */}
              <div className="mx-auto mb-5 h-[220px] w-[220px] overflow-hidden rounded-[28px]">
                {eventImg && (
                  <img
                    src={eventImg}
                    alt="駅イベントイラスト"
                    className="h-full w-full object-cover select-none"
                    draggable={false}
                  />
                )}
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
        </main>
      </div>
    </div>
  )
}
