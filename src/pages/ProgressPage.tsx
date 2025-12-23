import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PageShell } from '@/components/layout/PageShell'
import { StickyNextBar } from '@/components/layout/StickyNextBar'

function finalTheme(final: number) {
  // 0: セーフ（緑） / 1-2: ライト（青） / 3-4: ハード（黄） / 5+: デンジャー（赤）
  if (final <= 0) {
    return { accentText: 'text-emerald-700', glow: 'bg-emerald-300/35' }
  }
  if (final <= 2) {
    return { accentText: 'text-sky-700', glow: 'bg-sky-300/35' }
  }
  if (final <= 4) {
    return { accentText: 'text-amber-800', glow: 'bg-amber-300/45' }
  }
  return { accentText: 'text-red-900', glow: 'bg-red-400/45' }
}

export default function ProgressPage() {
  const { game, players, proceedPhase } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const drinkMap = useMemo(() => {
    // playerId -> final
    const map = new Map<string, number>()
    for (const d of game.currentDrinks ?? []) {
      map.set(d.playerId, d.final ?? 0)
    }
    return map
  }, [game.currentDrinks])

  const hasDrinks = (game.currentDrinks?.length ?? 0) > 0

  return (
    <PageShell
      step="STEP 7 / Progress"
      title="最終杯数"
      description="このターンの最終杯数（サマリ）を確認します。"
      rightBadgeText={activePlayer ? `代表: ${activePlayer.name}` : undefined}
    >
      <div className="flex min-h-full flex-col gap-5">
        {!hasDrinks && (
          <div className="w-full max-w-[520px] px-1">
            <p className="text-left text-sm leading-relaxed text-slate-700">
              まだ杯数が確定していません。Roll フェーズで抽選してください。
            </p>
          </div>
        )}

        {hasDrinks && (
          <section className="w-full">
            <div className="flex flex-col">
              {players.map((p, idx) => {
                const final = drinkMap.get(p.id) ?? 0
                const theme = finalTheme(final)

                return (
                  <div key={p.id}>
                    {idx !== 0 && <div className="h-6" />}

                    <div className="relative">
                      <div
                        className={[
                          'pointer-events-none absolute inset-0 rounded-[24px] blur-xl',
                          theme.glow,
                        ].join(' ')}
                      />

                      <div className="relative flex items-center justify-between px-2 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {p.name}
                            {p.id === activePlayer?.id && (
                              <span className="ml-2 align-middle rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                代表
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-end gap-2">
                          <span
                            className={[
                              'text-5xl font-black tracking-tight',
                              theme.accentText,
                            ].join(' ')}
                          >
                            {final}
                          </span>
                          <span className="pb-1 text-sm font-bold text-slate-600">
                            杯
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <StickyNextBar
          onNext={proceedPhase}
          disabled={!hasDrinks}
          hint={!hasDrinks ? '※ まだ杯数が確定していません。' : undefined}
        />
      </div>
    </PageShell>
  )
}
