import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { DrinkResult } from '@/types/game'

// ダミー画像（後で差し替え）
import drinkImg from '@/assets/drink_dummy.png'

// そのプレイヤーの DrinkResult を引く
function findResult(drinks: DrinkResult[], playerId: string) {
  return drinks.find((d) => d.playerId === playerId) ?? null
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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ヘッダー（StationEventPageと同じ） */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold text-sky-500">
              STEP 4 / Roll
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              杯数を抽選しよう
            </h1>
          </div>

          {activePlayer && (
            <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
              代表: {activePlayer.name}
            </div>
          )}
        </div>

        <p className="text-left text-xs text-slate-500">
          お酒アイコンをタップして、このプレイヤーの杯数を抽選します（このターン1回だけ）。
        </p>
      </header>

      {/* メインカード */}
      <section className="rounded-3xl bg-white/80 p-5 shadow-md">
        {/* 今回ロールする人 */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">抽選するプレイヤー</p>
            <p className="text-base font-semibold text-slate-900">
              {rollingPlayer ? rollingPlayer.name : '（プレイヤー未設定）'}
            </p>
            <p className="text-xs text-slate-500">
              フェーズ: {game.phase} / ターン: {game.turn}
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
            {alreadyRolled ? '抽選済' : '未抽選'}
          </div>
        </div>

        {/* お酒アイコン（タップでロール） */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleRoll}
            disabled={alreadyRolled || game.phase !== 'roll'}
            className="
              rounded-2xl bg-transparent outline-none
              transition-transform duration-150
              hover:scale-105 active:scale-95
              disabled:cursor-default disabled:opacity-60
            "
            aria-label="杯数を抽選"
          >
            <img
              src={drinkImg}
              alt="杯数抽選"
              className="h-44 w-44 select-none object-contain"
              draggable={false}
            />
          </button>

          {!alreadyRolled ? (
            <p className="text-xs text-slate-600">
              まだ抽選していません。お酒アイコンをタップして抽選してください。
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              抽選結果が確定しました。下に結果が表示されます。
            </p>
          )}
        </div>

        {/* 結果表示 */}
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-slate-700">抽選結果</p>
            <p className="text-[11px] text-slate-400">
              {rollingPlayer ? `Li: ${rollingPlayer.Li}` : ''}
            </p>
          </div>

          {result ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">base</span>
                <span className="font-medium">{result.base}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">moodMod</span>
                <span className="font-medium">{result.moodMod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">eventMod</span>
                <span className="font-medium">{result.eventMod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">passiveMod</span>
                <span className="font-medium">{result.passiveMod}</span>
              </div>

              {/* cardMod がある場合のみ表示（型に無ければ無視される） */}
              {'cardMod' in result && (
                <div className="flex justify-between">
                  <span className="text-slate-500">cardMod</span>
                  <span className="font-medium">{(result as any).cardMod}</span>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="font-semibold text-slate-700">final</span>
                <span className="text-base font-bold text-slate-900">
                  {result.final}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600">
              ここに抽選結果が表示されます。
            </p>
          )}
        </div>
      </section>

      {/* Debug枠（他ページと同じ位置） */}
      <section className="rounded-3xl bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-sm">
        <p className="mb-1 font-semibold text-slate-500">Debug</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>phase</span>
            <span>{game.phase}</span>
          </div>
          <div className="flex justify-between">
            <span>phasePlayerIndex</span>
            <span>{String(game.phasePlayerIndex)}</span>
          </div>
          <div className="flex justify-between">
            <span>currentDrinks件数</span>
            <span>{game.currentDrinks.length}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
