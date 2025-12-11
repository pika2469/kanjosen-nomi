// src/pages/StationPage.tsx
import { useGameStore } from '@/store/gameStore'
import { STATIONS } from '@/stations'
import stationDiceImg from '@/assets/station_dice_dummy3.png'
import type { Direction, StationId } from '@/types/game'

function getStationName(id: StationId | null | undefined): string {
  if (!id) return '未設定'
  const s = STATIONS.find((st) => st.id === id)
  return s ? s.name : String(id)
}

export default function StationPage() {
  const {
    game,
    players,
    settings,
    runStationPhase,
  } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  // サイコロクリックで駅決定
  const handleRoll = () => {
    // フェーズが station 以外、またはすでに決定済なら何もしない
    if (game.phase !== 'station') return
    if (game.lastStationSteps != null) return

    const steps = Math.floor(Math.random() * 6) + 1 // 1〜6
    const direction: Direction = Math.random() < 0.5 ? 'cw' : 'ccw'

    runStationPhase(steps, direction)
  }

  const currentStationId =
    game.currentStation ?? settings.startStationId ?? null
  const currentStationName = getStationName(currentStationId)

  const moved = game.lastStationSteps != null && game.lastStationDirection != null

  const directionLabel =
    game.lastStationDirection === 'cw'
      ? '時計回り'
      : game.lastStationDirection === 'ccw'
      ? '反時計回り'
      : '未決定'

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ヘッダー（MoodPage と揃える） */}
      <header className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold text-sky-500">
              STEP 2 / Station
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              駅を決めよう
            </h1>
          </div>
          {activePlayer && (
            <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
              代表: {activePlayer.name}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          このターンに向かう駅は、サイコロでランダムに決定されます。
          サイコロをタップすると、1〜6駅のどこかへ移動します
          （時計回り／反時計回りもランダム）。
        </p>
      </header>

      {/* メインカード */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
        {/* サイコロ：クリックで駅決定（1ターン1回） */}
        <button
          type="button"
          onClick={handleRoll}
          disabled={moved}
          className="
            flex h-44 w-44 items-center justify-center
            rounded-full bg-transparent outline-none
            transition-transform duration-150
            hover:scale-105 active:scale-95
            disabled:cursor-default disabled:opacity-75
          "
          aria-label="駅を決めるサイコロ"
        >
          <img
            src={stationDiceImg}
            alt="駅決定サイコロ"
            className="h-full w-full select-none rounded-full object-contain"
            draggable={false}
          />
        </button>

        {/* 今回の移動について */}
        <div className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <p className="mb-1 font-semibold text-slate-800">
            今回の移動について
          </p>

          {moved ? (
            <div className="space-y-1">
              <p>
                次の駅は
                <span className="font-semibold">「{currentStationName}」</span>
                です。
              </p>
              <p>
                このターンでは
                <span className="font-semibold">
                  {' '}{game.lastStationSteps}駅
                </span>
                分、<span className="font-semibold">{directionLabel}</span>
                に移動しました。
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600">
              まだこのターンの移動は決まっていません。
              上のサイコロをタップすると、移動先の駅と移動距離・方向が決定されます。
            </p>
          )}
        </div>
      </section>

      {/* Debug 情報（縮め気味に） */}
      <section className="rounded-2xl border bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Debug</span>
          <span className="text-[10px] text-slate-400">
            フェーズ: {game.phase}
          </span>
        </div>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">現在の駅</dt>
            <dd className="text-right font-medium text-slate-800">
              {currentStationName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">訪問済み駅数</dt>
            <dd className="text-right text-slate-800">
              {game.visitedStations.length}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">重複訪問</dt>
            <dd className="text-right text-slate-800">
              {settings.allowDuplicateStations ? '許可する' : '同じ駅は避ける'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
