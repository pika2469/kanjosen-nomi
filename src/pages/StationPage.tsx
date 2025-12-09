import { useGameStore } from '@/store/gameStore'
import { useState } from 'react'
import type { Direction } from '@/types/game'


export default function StationPage() {
    const { game, players, setPage, proceedPhase, runStationPhase } = useGameStore()
    const activePlayer = players[game.activePlayerIndex] ?? null

    // 直近の「進んだ駅数」と「方向」を表示するためのローカル状態
    const [lastSteps, setLastSteps] = useState<number | null>(null)
    const [lastDirection, setLastDirection] = useState<Direction | null>(null)

    const directionLabel =
            lastDirection === 'cw'
                ? '時計回り'
                : lastDirection === 'ccw'
                ? '反時計回り'
                : ''
    
    // 1~6駅 & 方向をランダムに決定して、駅+駅イベントを更新
    const handleRandomStation = () => {
        const steps = Math.floor(Math.random() * 6) + 1
        const direction: Direction = Math.random() < 0.5 ? 'cw' : 'ccw'

        runStationPhase(steps, direction)
        setLastSteps(steps)
        setLastDirection(direction)
    }

    // 「次のフェーズへ」押下時、まだ駅/イベントが決まっていない場合の対応
    const handleGoNext = () => {
        if (!game.currentStation || !game.currentEvent) {
            handleRandomStation()
        }
        proceedPhase()
        setPage('stationEvent')
    }

    return (
        <div className="mx-auto max-w-xl space-y-4 p-4">
            <header className="space-y-1">
                <h1 className="text-lg font-semibold">【2】駅決定</h1>
                <p className="text-xs text-gray-600">
                    現在フェーズ: {game.phase} / ターン: {game.turn}
                </p>
                {activePlayer && (
                <p className="text-xs text-gray-700">
                    代表プレイヤー: {activePlayer.name}
                </p>
                )}
                <p className="text-xs text-gray-600">
                    現在駅: {game.currentStation ?? '未決定'}
                </p>
            </header>

            <section className="rounded border bg-white p-3 text-sm space-y-2">
                <p className="text-gray-700">
                    簡易版として、1~6駅のランダム移動+方向ランダムで次の駅を決定
                </p>
                <button
                    type="button"
                    className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    onClick={handleRandomStation}
                >
                    駅をランダムに決める
                </button>

                <div className="mt-2 text-xs text-gray-700 space-y-1">
                    <p>
                        直近の決定:{' '}
                        {lastSteps && lastDirection
                            ? `${directionLabel}に${lastSteps}駅移動`
                            : 'まだ決定されていません'
                        }
                    </p>
                    <p>現在駅ID: {game.currentStation ?? '未決定'}</p>
                    <p>駅イベントID: {game.currentEvent?.id ?? '未決定'}</p>
                </div>
            </section>

            <section className="flex justify-between gap-2 text-xs">
                <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setPage('home')}
                >
                Homeへ
                </button>
                <div className="flex gap-2">
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => setPage('debug')}
                >
                    Debugページへ
                </button>
                <button
                    type="button"
                    className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                    onClick={handleGoNext}
                >
                    次のフェーズへ
                </button>
                </div>
            </section>
        </div>
    )
}