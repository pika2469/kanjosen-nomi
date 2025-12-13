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

  // ▼ 追加：選択中カード
  const [selectedCardId, setSelectedCardId] = useState<CardId | ''>('')

  // ▼ 既存：狙い撃ちターゲット
  const [shootTargetId, setShootTargetId] = useState<string>('')

  const hand = phasePlayer?.hand ?? []

  // 初期表示：先頭のカード
  useEffect(() => {
    if (!phasePlayer) {
      setSelectedCardId('')
      return
    }
    if (hand.length === 0) {
      setSelectedCardId('')
      return
    }
    // 選択中が無い / すでに手札から消えた → 先頭に
    if (!selectedCardId || !hand.includes(selectedCardId as CardId)) {
      setSelectedCardId(hand[0])
    }
  }, [phasePlayer?.id, hand.join('|')]) // handの変化検知用（簡易）

  // 選択カードが atk_shoot の時だけターゲット候補を出す
  const shootTargets = useMemo(() => {
    if (!phasePlayer) return []
    return players.filter((p) => p.id !== phasePlayer.id)
  }, [players, phasePlayer])

  // 選択カードが変わったら、狙い撃ちターゲットもリセット（任意）
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

  const kindLabel = (() => {
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
  })()

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header（既存のまま） */}
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

        <p className="text-sm text-slate-600">
          処理中プレイヤーの手札からカードを選んで使用します（このターン1回だけのカードもあります）。
        </p>
      </header>

      {/* Main */}
      <section className="rounded-2xl border bg-white/80 p-4 shadow-sm">
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

        {/* 手札UI：2ブロック構成 */}
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700">手札</p>

          {!phasePlayer ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              操作中プレイヤーが見つかりません。
            </div>
          ) : hand.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              手札がありません。
            </div>
          ) : (
            <>
              {/* 上段：カードアイコン行（横スクロール可） */}
              <div className="rounded-2xl border bg-white p-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {hand.map((cid) => {
                    const img = getCardImage(cid)
                    const isActive = cid === selectedCardId

                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => setSelectedCardId(cid)}
                        className={[
                          'shrink-0 rounded-xl p-1 transition',
                          'outline-none focus:outline-none focus-visible:outline-none',
                          isActive
                            ? 'ring-2 ring-sky-400 ring-offset-2'
                            : 'ring-1 ring-slate-200 hover:ring-slate-300',
                        ].join(' ')}
                        aria-label={`カード選択: ${cid}`}
                      >
                        <img
                          src={img}
                          alt={cid}
                          className="h-12 w-12 select-none object-contain"
                          draggable={false}
                        />
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  上のアイコンをタップしてカードを選択してください。
                </p>
              </div>

              {/* 下段：詳細カード（1枚だけ表示） */}
              {selectedCardId && selectedTheme && selectedImg && (
                <div
                  className={[
                    'overflow-hidden rounded-2xl border bg-white shadow-sm',
                    selectedTheme.frame,
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

                  {/* 画像 */}
                  <div className="px-4 pt-4">
                    <div className="rounded-2xl bg-white p-3">
                      <img
                        src={selectedImg}
                        alt={selectedName}
                        className="mx-auto block h-48 w-full object-contain select-none"
                        draggable={false}
                      />
                    </div>

                    <p className="mt-2 text-center text-[11px] font-mono text-slate-500">
                      {selectedCardId}
                    </p>
                  </div>

                  {/* 説明文＋使用ボタン */}
                  <div className="px-4 pb-4 pt-3">
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
                        (selectedCardId === 'atk_shoot' && !!shootTargets.length && !shootTargetId)
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

      {/* Debug（既存のままでもOK） */}
      <section className="rounded-2xl border bg-white/70 p-4 text-sm shadow-sm">
        <div className="text-center font-semibold text-slate-700">Debug</div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-700">
          <div>phase</div>
          <div className="text-right">{game.phase}</div>

          <div>turn</div>
          <div className="text-right">{game.turn}</div>

          <div>phasePlayerIndex</div>
          <div className="text-right">{String(game.phasePlayerIndex)}</div>

          <div>lastUsedCard</div>
          <div className="text-right">
            {game.lastUsedCard ? `${game.lastUsedCard.cardId}` : '---'}
          </div>
        </div>
      </section>
    </div>
  )
}