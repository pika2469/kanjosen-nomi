import { useGameStore } from '@/store/gameStore'

export function MiniGameHubPage() {
  const { setPage } = useGameStore()

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900">
          ミニゲーム
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          本編とは独立した、短時間で遊べるミニゲームです。
        </p>
      </section>

      <section className="space-y-4">
        {/* 反射神経テスト */}
        <button
          type="button"
          onClick={() => setPage('minigame_reaction')}
          className="
            group w-full
            rounded-3xl px-6 py-6 text-left
            bg-gradient-to-br from-sky-100 via-sky-50 to-white
            ring-1 ring-sky-200/60
            shadow-sm
            transition-all duration-200
            hover:-translate-y-1 hover:shadow-md
            active:translate-y-0 active:scale-[0.99]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">REACTION</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                反射神経テスト
              </p>
              <p className="mt-1 text-xs text-slate-600">
                光った瞬間にタップ。反応速度を計測します。
              </p>
            </div>
          </div>
        </button>

        {/* 連打チャレンジ */}
        <button
          type="button"
          onClick={() => setPage('minigame_mash')}
          className="
            group w-full
            rounded-3xl px-6 py-6 text-left
            bg-gradient-to-br from-amber-100 via-amber-50 to-white
            ring-1 ring-amber-200/60
            shadow-sm
            transition-all duration-200
            hover:-translate-y-1 hover:shadow-md
            active:translate-y-0 active:scale-[0.99]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">MASH</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                連打チャレンジ
              </p>
              <p className="mt-1 text-xs text-slate-600">
                5秒間で何回タップできるかに挑戦。
              </p>
            </div>
          </div>
        </button>

        {/* フェイクボタン */}
        <button
          type="button"
          onClick={() => setPage('minigame_fake')}
          className="
            group w-full
            rounded-3xl px-6 py-6 text-left
            bg-gradient-to-br from-rose-100 via-rose-50 to-white
            ring-1 ring-rose-200/60
            shadow-sm
            transition-all duration-200
            hover:-translate-y-1 hover:shadow-md
            active:translate-y-0 active:scale-[0.99]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-700">FAKE</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                フェイクボタンゲーム
              </p>
              <p className="mt-1 text-xs text-slate-600">
                本物のボタンは1つだけ。見抜けるか？
              </p>
            </div>
          </div>
        </button>
      </section>
    </div>
  )
}
