import { useGameStore } from '@/store/gameStore'
import { MOODS } from '@/constants/mood'
import rouletteImg from '@/assets/mood_roulette_dummy4.png'

export default function MoodPage() {
    const { game, players, spinMood, clearMood } =
        useGameStore()

    const activePlayer = players[game.activePlayerIndex] ?? null
    const moodInfo = MOODS.find((m) => m.id === game.mood) ?? null

    return (
        <div className="flex min-h-full flex-col space-y-4">
            {/* ヘッダー（MainLayoutの中身用） */}
            <header className="space-y-2">
                <div className="flex items-center justify-between">
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

            {/* ルーレットカード */}
            <section className="w-full rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col items-center gap-4">
                    {/* 画像タップで spinMood。ボタン自体を丸くマスク */}
                    <button
                    type="button"
                    onClick={spinMood}
                    className="
                        flex h-44 w-44 items-center justify-center
                        rounded-full overflow-hidden bg-transparent
                        outline-none focus-visible:outline-none
                        transition-transform duration-150
                        hover:scale-105 active:scale-95
                    "
                    >
                    <img
                        src={rouletteImg}
                        alt="ムードルーレット"
                        className="h-full w-full select-none object-contain pointer-events-none"
                    />
                    </button>

                    {/* 現在のムード表示 */}
                    <div className="w-full space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs">
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
                                <span className="mt-0.5 text-lg">
                                    {moodInfo.icon}
                                </span>
                                <div className="space-y-0.5">
                                    <div className="text-xs font-semibold">
                                        {moodInfo.label}
                                    </div>
                                    {moodInfo.description && (
                                        <div className="text-[11px] text-gray-500">
                                            {moodInfo.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-[11px] text-gray-500">
                                まだムードが決まっていません。
                                ルーレットをタップして決定します。
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* デバッグ用情報も中央の枠にまとめる */}
            <section className="w-full rounded-2xl border bg-white p-3 text-[11px] text-gray-500">
                <div className="mb-1 text-[10px] font-semibold text-slate-500">
                    Debug
                </div>
                <div className="flex justify-between">
                    <span>フェーズ: {game.phase}</span>
                    <span>ターン: {game.turn}</span>
                </div>
            </section>
        </div>
    )
}
