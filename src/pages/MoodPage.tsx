import { useGameStore } from '@/store/gameStore'
import { MOODS } from '@/constants/mood'
import rouletteImg from '@/assets/mood_roulette_dummy.png'

export default function MoodPage() {
    const { game, players, setPage, proceedPhase, spinMood, clearMood } =
        useGameStore()

    const activePlayer = players[game.activePlayerIndex] ?? null
    const moodInfo = MOODS.find((m) => m.id === game.mood) ?? null

    const handleNext = () => {
        if (!game.mood) {
            spinMood()
        }
        proceedPhase()
        setPage('station')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex justify-center">
            <div className="mx-auto w-full max-w-md space-y-4 p-4 text-left">
                {/* ヘッダー */}
                <header className="space-y-2">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 text-left">
                            <p className="text-[11px] font-semibold text-indigo-500">
                                STEP 1 / Mood
                            </p>
                            <h1 className="text-lg font-bold text-gray-900">
                                ムードを決めよう
                            </h1>
                        </div>
                        {activePlayer && (
                            <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
                                代表: {activePlayer.name}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        このターンの雰囲気をルーレットで決定します。
                    </p>
                </header>

                {/* ルーレット画像＋説明 */}
                <section className="w-full flex flex-col items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                    {/* 画像タップで spinMood（フォーカス枠は無効化済） */}
                    <button
                        type="button"
                        onClick={spinMood}
                        tabIndex={-1}
                        className="relative rounded-full outline-none focus:outline-none focus-visible:outline-none active:outline-none border-none"
                    >
                        <img
                            src={rouletteImg}
                            alt="ムードルーレット"
                            className="h-44 w-44 rounded-full object-cover shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 select-none border-none outline-none"
                        />
                    </button>

                    {/* 現在のムード表示（idバッジ削除・1カラム構成） */}
                    <div className="w-full min-h-[72px] space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">
                                現在のムード
                            </span>
                            <button
                                type="button"
                                className="text-[11px] text-slate-500 underline"
                                onClick={clearMood}
                            >
                                リセット
                            </button>
                        </div>

                        {moodInfo ? (
                            <div className="flex items-start gap-2">
                                <span className="mt-[1px] text-lg">
                                    {moodInfo.icon}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold">
                                        {moodInfo.label}
                                    </div>
                                    {moodInfo.description && (
                                        <div className="text-[11px] text-gray-500 break-words">
                                            {moodInfo.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-[11px] text-gray-500">
                                まだムードが決まっていません。ルーレットをタップして決定します。
                            </div>
                        )}
                    </div>
                </section>

                {/* フッタ操作：3ボタン等幅 */}
                <section className="flex gap-2 text-xs">
                    <button
                        type="button"
                        className="flex-1 rounded-full bg-slate-200 px-4 py-2 text-center font-medium text-slate-800 hover:bg-slate-300"
                        onClick={() => setPage('home')}
                    >
                        Homeへ
                    </button>

                    <button
                        type="button"
                        className="flex-1 rounded-full bg-slate-200 px-4 py-2 text-center font-medium text-slate-800 hover:bg-slate-300"
                        onClick={() => setPage('debug')}
                    >
                        Debug
                    </button>

                    <button
                        type="button"
                        className="flex-1 rounded-full bg-green-600 px-4 py-2 text-center font-semibold text-white hover:bg-green-700"
                        onClick={handleNext}
                    >
                        駅へ進む
                    </button>
                </section>

                {/* 補足情報 */}
                <section className="rounded-2xl border bg-white p-3 text-[11px] text-gray-500">
                    <div className="flex justify-between">
                        <span>フェーズ: {game.phase}</span>
                        <span>ターン: {game.turn}</span>
                    </div>
                </section>
            </div>
        </div>
    )
}
