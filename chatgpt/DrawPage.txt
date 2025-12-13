import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getCardById } from '@/cards'

// ダミー画像（後で差し替え）
import cardDrawImg from '@/assets/card_draw_dummy.png'

export default function DrawPage() {
  const { game, players, drawForDrawPhase } = useGameStore()

  const activePlayer = players[game.activePlayerIndex] ?? null

  // draw の操作対象（phasePlayerIndex）
  const drawIndex = game.phasePlayerIndex ?? 0
  const drawPlayer = players[drawIndex] ?? null

  // このターンにカードを引いたか（ゲーム状態だけで判定）
  // 仕様：drawフェーズは各プレイヤーにつき「ベース1枚 + nextTurnExtraDraw分」を drawCard() で引く
  // ここでは「少なくとも1枚引いたか」を判定するために lastUsedCard は使わず、手札の増加は見ない（履歴が無いので）
  // => 確実に1回だけにしたいなら game に "drawnThisTurnPlayerIds" を持つのがベスト。
  // ただ現状は MainLayout の「進む」で draw フェーズが自動実行される可能性もあるため、
  // UIからは「操作対象の手札が増えていたら抽選済み扱い」に寄せるのが実用的。

  const drawnThisPlayer = useMemo(() => {
    if (!drawPlayer) return false
    return (game.drawnPlayerIds ?? []).includes(drawPlayer.id)
  }, [drawPlayer, game.drawnPlayerIds])

  const isHandFull =
    !!drawPlayer && (drawPlayer.hand?.length ?? 0) >= (drawPlayer.handSizeMax ?? 0)

  const latestCard = useMemo(() => {
    if (!drawPlayer) return null
    const lastId = drawPlayer.hand?.[drawPlayer.hand.length - 1]
    return lastId ? getCardById(lastId) : null
  }, [drawPlayer])

  const handleDraw = () => {
    if (game.phase !== 'draw') return
    if (!drawPlayer) return
    if (isHandFull) return
    if (drawnThisPlayer) return
    drawForDrawPhase(drawPlayer.id)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ヘッダー：StationEventPage と同じ構造に揃える */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold text-sky-500">STEP 5 / Draw</p>
            <h1 className="text-lg font-bold text-slate-900">カードを引こう</h1>
          </div>

          {activePlayer && (
            <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
              代表: {activePlayer.name}
            </div>
          )}
        </div>

        <p className="text-left text-xs text-slate-500">
          カード画像をタップして、このプレイヤーのカードをドローします（このターン1回だけ）。
        </p>
      </header>

      {/* メインカード */}
      <section className="rounded-3xl bg-white/80 p-5 shadow-md">
        {/* 今回ドローする人 */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">ドローするプレイヤー</p>
            <p className="text-base font-semibold text-slate-900">
              {drawPlayer ? drawPlayer.name : '（プレイヤー未設定）'}
            </p>
            <p className="text-xs text-slate-500">
              フェーズ: {game.phase} / ターン: {game.turn}
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
            {isHandFull ? '手札上限' : drawnThisPlayer ? 'ドロー済' : '未ドロー'}
          </div>
        </div>

        {/* カード画像タップでドロー */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDraw}
            disabled={game.phase !== 'draw' || isHandFull || drawnThisPlayer}
            className="
              rounded-2xl bg-transparent outline-none
              transition-transform duration-150
              hover:scale-105 active:scale-95
              disabled:cursor-default disabled:opacity-60
            "
            aria-label="カードをドロー"
          >
            <img
              src={cardDrawImg}
              alt="カードドロー"
              className="h-44 w-44 select-none object-contain"
              draggable={false}
            />
          </button>

          {isHandFull ? (
            <p className="text-xs text-slate-600">
              手札が上限のため、これ以上カードを引けません。
            </p>
          ) : drawnThisPlayer ? (
            <p className="text-xs text-slate-600">
              このプレイヤーはすでにドロー済みです。
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              まだドローしていません。カード画像をタップしてドローしてください。
            </p>
          )}
        </div>

        {/* 結果（手札と直近カード） */}
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-slate-700">手札</p>
            {drawPlayer && (
              <p className="text-[11px] text-slate-500">
                {drawPlayer.hand.length}/{drawPlayer.handSizeMax}
              </p>
            )}
          </div>

          {!drawPlayer || drawPlayer.hand.length === 0 ? (
            <p className="text-[11px] text-slate-600">手札はまだありません。</p>
          ) : (
            <div className="space-y-2">
              {/* 直近カード */}
              <div className="rounded-xl bg-white px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-500">直近のカード</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {latestCard?.name ?? '（不明）'}
                </p>
                {latestCard?.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    {latestCard.description}
                  </p>
                )}
              </div>

              {/* 手札一覧（IDだけでも良いが、名前が取れれば名前表示） */}
              <div className="flex flex-wrap gap-2">
                {drawPlayer.hand.map((cid, i) => {
                  const c = getCardById(cid)
                  return (
                    <span
                      key={`${cid}-${i}`}
                      className="rounded-full bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm"
                    >
                      {c?.name ?? cid}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Debug枠 */}
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
        </div>
      </section>
    </div>
  )
}
