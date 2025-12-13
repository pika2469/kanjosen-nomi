import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'

export default function ProgressPage() {
  const { game, players, runProgressPhase } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  const hasDrinks = (game.currentDrinks?.length ?? 0) > 0

  // ★ 成長判定をこのページで実行済みか
  const [applied, setApplied] = useState(false)

  const totalFinalDrinks = useMemo(() => {
    if (!hasDrinks) return 0
    return game.currentDrinks.reduce((sum, d) => sum + (d.final ?? 0), 0)
  }, [hasDrinks, game.currentDrinks])

  const handleApply = () => {
    if (!hasDrinks) return
    if (applied) return

    runProgressPhase()
    setApplied(true)
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* ヘッダー */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold text-sky-500">
              STEP 7 / Progress
            </p>
            <h1 className="text-lg font-bold text-slate-900">成長判定</h1>
          </div>

          {activePlayer && (
            <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
              代表: {activePlayer.name}
            </div>
          )}
        </div>

        <p className="text-left text-xs text-slate-500">
          このターンの杯数結果をもとに、各プレイヤーの XP / Lv / SP を反映します。
        </p>
      </header>

      {/* ✅ 恒久表示：成長判定済みバナー */}
      {applied && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-emerald-900 text-left">
              成長判定は既に反映されています
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              完了
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-800 text-left">
            このターンでは、これ以上成長判定を実行できません。
          </p>
        </section>
      )}

      {/* メインカード */}
      <section className="rounded-3xl bg-white/80 p-5 shadow-md">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1 text-left">
            <p className="text-xs font-semibold text-slate-500">現在状況</p>
            <p className="text-sm text-slate-700">
              フェーズ: <span className="font-semibold">{game.phase}</span> / ターン:{' '}
              <span className="font-semibold">{game.turn}</span>
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
            {hasDrinks ? '杯数あり' : '杯数なし'}
          </div>
        </div>

        {!hasDrinks && (
          <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
            まだ杯数が抽選されていません。Roll フェーズで抽選してから成長判定を実行してください。
          </div>
        )}

        {hasDrinks && (
          <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">このターンの合計（参考）</span>
              <span className="font-semibold">{totalFinalDrinks} 杯</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              ※ XP / Lv / SP の反映はゲームロジックに従います。
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleApply}
          disabled={!hasDrinks || applied}
          className={[
            'w-full rounded-2xl px-4 py-3 text-base font-bold transition',
            !hasDrinks || applied
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]',
          ].join(' ')}
        >
          {applied ? '成長判定は完了しています' : '成長判定を実行'}
        </button>
      </section>

      {/* プレイヤー一覧 */}
      <section className="rounded-3xl bg-white/70 px-4 py-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">プレイヤー状況</p>
          <p className="text-[11px] text-slate-400">{players.length} 人</p>
        </div>

        {players.length === 0 ? (
          <p className="text-xs text-slate-600 text-left">
            プレイヤーが登録されていません。
          </p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"
              >
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {p.name}
                    {p.id === activePlayer?.id && (
                      <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        代表
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Lv {p.level} / XP {p.xp} / SP {p.sp} / Li {p.Li}
                  </p>
                </div>

                <div className="shrink-0 text-right text-[11px] text-slate-500">
                  手札 {p.hand.length} / {p.handSizeMax}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Debug */}
      <section className="rounded-3xl bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-sm">
        <p className="mb-1 font-semibold text-slate-500">Debug</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>phase</span>
            <span>{game.phase}</span>
          </div>
          <div className="flex justify-between">
            <span>turn</span>
            <span>{game.turn}</span>
          </div>
          <div className="flex justify-between">
            <span>currentDrinks件数</span>
            <span>{game.currentDrinks.length}</span>
          </div>
          <div className="flex justify-between">
            <span>progressApplied</span>
            <span>{applied ? 'true' : 'false'}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
