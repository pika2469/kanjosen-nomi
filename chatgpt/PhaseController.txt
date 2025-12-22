import { useGameStore } from '../../store/gameStore'
import type { Phase } from '../../types/game'

export function usePhaseController() {
    const { game, setPhase, nextTurn} = useGameStore()

    function proceed() {
        const order: Phase[] = ['mood', 'station', 'stationEvent', 'roll', 'draw', 'useCards', 'progress', 'result']
        const i = order.indexOf(game.phase)
        if (i < 0 || i === order.length -1) {
            // 最終フェーズ→次のターンへ (i<0は定義されていないフェーズが入った場合に次ターンへ飛ばす)
            nextTurn()
            return
        }
        // 最終フェーズでない限り、次のフェーズへ進む
        setPhase(order[i + 1])
    }

    // 初期フェーズにリセット
    function resetToFirst() {
        setPhase('mood')
    }

    // UI側へAPIを返す
    return {
        phase: game.phase,
        proceed,
        resetToFirst,
    }
}