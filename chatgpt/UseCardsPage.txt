import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { CardId } from '@/types/game'
import { getCardById } from '@/cards'

// フォールバック画像（未用意カード用）
import cardDefaultImg from '@/assets/cards/card_default.png'

// src/assets/cards/*.png を一括読み込み（Vite）
// キー例: "/src/assets/cards/atk_hitokuchi_plus.png"
const CARD_IMAGES = import.meta.glob('/src/assets/cards/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function getCardImage(cardId: CardId) {
  const key = `/src/assets/cards/${cardId}.png`
  return CARD_IMAGES[key] ?? cardDefaultImg
}

function getCardKind(cardId: string): 'atk' | 'safe' | 'sp' | 'trick' | 'other' {
  if (cardId.startsWith('atk_')) return 'atk'
  if (cardId.startsWith('safe_')) return 'safe'
  if (cardId.startsWith('sp_')) return 'sp'
  if (cardId.startsWith('trick_')) return 'trick'
  return 'other'
}

// タイプ別の “ポケカ風” テーマ（淡いグラデ＋枠色）
function getCardTheme(cardId: string) {
  const kind = getCardKind(cardId)
  switch (kind) {
    case 'atk':
      return {
        frame: 'border-rose-200',
        header: 'from-rose-50 to-rose-100',
        badge: 'bg-rose-100 text-rose-700',
      }
    case 'safe':
      return {
        frame: 'border-emerald-200',
        header: 'from-emerald-50 to-emerald-100',
        badge: 'bg-emerald-100 text-emerald-700',
      }
    case 'sp':
      return {
        frame: 'border-violet-200',
        header: 'from-violet-50 to-violet-100',
        badge: 'bg-violet-100 text-violet-700',
      }
    case 'trick':
      return {
        frame: 'border-amber-200',
        header: 'from-amber-50 to-amber-100',
        badge: 'bg-amber-100 text-amber-700',
      }
    default:
      return {
        frame: 'border-slate-200',
        header: 'from-slate-50 to-slate-100',
        badge: 'bg-slate-100 text-slate-700',
      }
  }
}

export default function UseCardsPage() {
  const { game, players, useCard } = useGameStore()

  const phasePlayer =
    game.phasePlayerIndex != null ? players[game.phasePlayerIndex] : null
  const activePlayer = players[game.activePlayerIndex] ?? null

  const isBlocked =
    !!phasePlayer && game.cardUsageBlockedForPlayerId === phasePlayer.id

  const hand = phasePlayer?.hand ?? []

  // playerId の最終杯数(final)を引く（未ロールなら null）
  const getFinalDrink = (playerId: string): number | null => {
    const r = game.currentDrinks.find((d) => d.playerId === playerId)
    return r ? r.final : null
  }


  // ▼ 修正：選択状態は cardId ではなく「手札インデックス」で管理（同カード重複対応）
  const [selectedHandIndex, setSelectedHandIndex] = useState<number>(-1)

  // ▼ 既存：狙い撃ちターゲット
  const [shootTargetId, setShootTargetId] = useState<string>('')

  // 初期表示：先頭（phasePlayer変更や手札枚数変更に追従）
  useEffect(() => {
    if (!phasePlayer || hand.length === 0) {
      setSelectedHandIndex(-1)
      return
    }
    setSelectedHandIndex((prev) => {
      if (prev < 0 || prev >= hand.length) return 0
      return prev
    })
  }, [phasePlayer?.id, hand.length])

  // 選択中のカードID（インデックスから算出）
  const selectedCardId: CardId | '' = useMemo(() => {
    if (selectedHandIndex < 0) return ''
    const cid = hand[selectedHandIndex]
    return (cid ?? '') as CardId | ''
  }, [hand, selectedHandIndex])

  // 選択カードが atk_shoot の時だけターゲット候補を出す
  const shootTargets = useMemo(() => {
    if (!phasePlayer) return []
    return players.filter((p) => p.id !== phasePlayer.id)
  }, [players, phasePlayer])

  // 選択カードが変わったら、狙い撃ちターゲットもリセット
  useEffect(() => {
    if (selectedCardId !== 'atk_shoot') setShootTargetId('')
  }, [selectedCardId])

  const handleUseSelected = () => {
    if (!phasePlayer) return
    if (isBlocked) return
    if (!selectedCardId) return

    // atk_shoot はターゲット必須（未選択なら中断）
    if (selectedCardId === 'atk_shoot') {
      if (!shootTargetId) return

      const useCardAny = useCard as unknown as (
        playerId: string,
        cardId: CardId,
        targetPlayerId?: string,
      ) => void

      useCardAny(phasePlayer.id, selectedCardId, shootTargetId)
      return
    }

    useCard(phasePlayer.id, selectedCardId)
  }

  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null

  const selectedName = selectedCard?.name ?? (selectedCardId || '')
  const selectedDesc = selectedCard?.description ?? '（説明文未設定）'
  const selectedImg = selectedCardId ? getCardImage(selectedCardId) : null
  const selectedTheme = selectedCardId ? getCardTheme(selectedCardId) : null

  const kindLabel = useMemo(() => {
    if (!selectedCardId) return ''
    const kind = getCardKind(selectedCardId)
    return kind === 'atk'
      ? 'アタック'
      : kind === 'safe'
        ? 'セーフ'
        : kind === 'sp'
          ? 'スペシャル'
          : kind === 'trick'
            ? 'トリック'
            : 'その他'
  }, [selectedCardId])

  return (
    <div className="flex min-h-full flex-col gap-3">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold text-sky-500">
              STEP 6 / Cards
            </p>
            <h1 className="text-lg font-bold text-slate-900">カードを使おう</h1>
          </div>

          {activePlayer && (
            <span className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white">
              代表: {activePlayer.name}
            </span>
          )}
        </div>

        {/* 縦圧縮：説明文を短く＆小さく */}
        <p className="text-xs text-slate-600">
          処理中プレイヤーの手札からカードを選んで使用します。
        </p>
      </header>

      {/* Main */}
      <section className="rounded-2xl border bg-white/80 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">操作中プレイヤー</p>
            <p className="text-base font-semibold">
              {phasePlayer ? phasePlayer.name : '---'}
            </p>
          </div>

          {isBlocked && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              このターンはカード使用不可
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {!phasePlayer ? (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              操作中プレイヤーが見つかりません。
            </div>
          ) : hand.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              手札がありません。
            </div>
          ) : (
            <>
              {/* 上段：カードアイコン行（横スクロール可） */}
              <div className="rounded-2xl border bg-white p-2">
                {/* ハイライト欠け対策：スクロール領域に余白（p-2）を付与 */}
                <div className="flex items-center gap-2 overflow-x-auto p-2">
                  {hand.map((cid, idx) => {
                    const img = getCardImage(cid as CardId)
                    const isActive = idx === selectedHandIndex

                    return (
                      <button
                        key={`${cid}-${idx}`} // ★重複回避
                        type="button"
                        onClick={() => setSelectedHandIndex(idx)} // ★indexで選択
                        className={[
                          'shrink-0 rounded-xl p-1 transition',
                          'outline-none focus:outline-none focus-visible:outline-none',
                          isActive
                            ? 'ring-2 ring-sky-400 -translate-y-0.5 shadow-sm' // 軽く浮かせる
                            : 'ring-1 ring-slate-200 hover:ring-slate-300',
                        ].join(' ')}
                        aria-label={`カード選択: ${cid}`}
                      >
                        <img
                          src={img}
                          alt={String(cid)}
                          className="h-12 w-12 select-none object-contain"
                          draggable={false}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 下段：詳細カード（1枚だけ表示） */}
              {selectedCardId && selectedTheme && selectedImg && (
                <div
                  className={[
                    'overflow-hidden rounded-2xl border bg-white',
                    selectedTheme.frame,
                    // ★中央カードを少し浮かせる演出
                    '-translate-y-1 shadow-md',
                    'transition-transform duration-150',
                  ].join(' ')}
                >
                  {/* ポケカ風：上部にカード名 */}
                  <div
                    className={[
                      'flex items-center justify-between gap-2 border-b px-4 py-3',
                      'bg-gradient-to-r',
                      selectedTheme.header,
                    ].join(' ')}
                  >
                    <p className="min-w-0 truncate text-base font-extrabold text-slate-900">
                      {selectedName}
                    </p>
                    <span
                      className={[
                        'shrink-0 rounded-full px-3 py-1 text-[11px] font-bold',
                        selectedTheme.badge,
                      ].join(' ')}
                    >
                      {kindLabel}
                    </span>
                  </div>

                  {/* 画像（縦圧縮：h-48 → h-40） */}
                  <div className="px-4 pt-3">
                    <div className="rounded-2xl bg-white p-3">
                      <img
                        src={selectedImg}
                        alt={selectedName}
                        className="mx-auto block h-40 w-full select-none object-contain"
                        draggable={false}
                      />
                    </div>

                    <p className="mt-2 text-center text-[11px] font-mono text-slate-500">
                      {selectedCardId}
                    </p>
                  </div>

                  {/* 説明文＋使用ボタン */}
                  <div className="px-4 pb-4 pt-2">
                    {/* atk_shoot の時だけターゲット選択 */}
                    {selectedCardId === 'atk_shoot' && (
                      <div className="mb-3 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          狙い撃ち：対象プレイヤー
                        </p>
                        <div className="mt-2">
                          <select
                            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                            value={shootTargetId}
                            onChange={(e) => setShootTargetId(e.target.value)}
                            disabled={isBlocked || shootTargets.length === 0}
                          >
                            <option value="">選択してください</option>
                            {shootTargets.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          ※未選択の場合、狙い撃ちは実行できません。
                        </p>
                      </div>
                    )}

                    <p className="text-sm leading-6 text-slate-700">
                      {selectedDesc}
                    </p>

                    <button
                      type="button"
                      onClick={handleUseSelected}
                      disabled={
                        isBlocked ||
                        (selectedCardId === 'atk_shoot' &&
                          !!shootTargets.length &&
                          !shootTargetId)
                      }
                      className={[
                        'mt-4 w-full rounded-2xl px-4 py-3 text-base font-bold transition',
                        isBlocked
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]',
                      ].join(' ')}
                    >
                      使用
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 現在の最終杯数（カード選択の参考用） */}
      <section className="rounded-2xl border bg-white/80 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 text-left">
            現在の最終杯数
          </p>
          <p className="text-[11px] text-slate-500">
            {game.currentDrinks.length > 0 ? 'Roll済' : '未Roll'}
          </p>
        </div>

        {players.length === 0 ? (
          <div className="mt-2 text-sm text-slate-600 text-left">
            プレイヤーがいません。
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {players.map((p) => {
              const final = getFinalDrink(p.id)

              // 操作中プレイヤー強調
              const isPhase = p.id === phasePlayer?.id

              // 杯数で色分け（0-2: emerald / 3-4: amber / 5+: rose）
              const drinkPillClass =
                final == null
                  ? 'bg-slate-200 text-slate-600'
                  : final <= 2
                    ? 'bg-emerald-100 text-emerald-800'
                    : final <= 4
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'

              // 行の背景/枠（操作中のみ強調）
              const rowClass = isPhase
                ? 'bg-sky-50/70 ring-1 ring-sky-200'
                : 'bg-slate-50'

              return (
                <li
                  key={p.id}
                  className={[
                    'flex items-center justify-between rounded-xl px-3 py-2',
                    rowClass,
                  ].join(' ')}
                >
                  {/* 左：名前/Li（左寄せ固定） */}
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {p.name}
                      {isPhase && (
                        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                          操作中
                        </span>
                      )}
                      {p.id === activePlayer?.id && (
                        <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                          代表
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Li: {p.Li}
                    </p>
                  </div>

                  {/* 右：杯数ピル */}
                  <div className="shrink-0 text-right">
                    {final == null ? (
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-[11px] font-semibold',
                          drinkPillClass,
                        ].join(' ')}
                      >
                        ---
                      </span>
                    ) : (
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-[12px] font-extrabold',
                          drinkPillClass,
                        ].join(' ')}
                      >
                        {final}杯
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {game.currentDrinks.length === 0 && (
          <p className="mt-2 text-[11px] text-slate-500 text-left">
            ※ まだ杯数が抽選されていません（Rollフェーズで抽選すると表示されます）。
          </p>
        )}
      </section>

      {/* Debug */}
      <section className="rounded-2xl border bg-white/70 p-3 text-sm shadow-sm">
        <div className="text-center font-semibold text-slate-700">Debug</div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-700">
          <div>phase</div>
          <div className="text-right">{game.phase}</div>

          <div>turn</div>
          <div className="text-right">{game.turn}</div>

          <div>phasePlayerIndex</div>
          <div className="text-right">{String(game.phasePlayerIndex)}</div>

          <div>selectedHandIndex</div>
          <div className="text-right">{String(selectedHandIndex)}</div>

          <div>selectedCardId</div>
          <div className="text-right">{selectedCardId || '---'}</div>

          <div>lastUsedCard</div>
          <div className="text-right">
            {game.lastUsedCard ? `${game.lastUsedCard.cardId}` : '---'}
          </div>
        </div>
      </section>
    </div>
  )
}
