import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { CardId, Direction, PassiveId } from '@/types/game'
import { PASSIVES } from '@/passives'

// React関数コンポーネント
export const TurnPage = () => {

    const {
        game,
        players,
        settings,
        proceedPhase,
        runRollPhase,
        runRollPhaseForPlayer,
        spinMood,
        clearMood,
        drawCard,
        drawToAll,
        setPage,
        useCard,
        moveStation,
        runProgressPhase,
        runStationPhase,
        debugGrantPassive,
        clearHands,
        resolveDualRoll,
    } = useGameStore()

    // 代表プレイヤー(activePlayer)と今処理中のプレイヤー(phasePlayer)
    const activePlayer = players[game.activePlayerIndex] ?? null
    const phasePlayer = game.phasePlayerIndex != null ? players[game.phasePlayerIndex] ?? null : null

    // パッシブ付与用デバッグ状態
    const [debugPassiveId, setDebugPassiveId] = useState('')
    const [debugPassiveTargetId, setDebugPassiveTargetId] = useState('')

    // 狙い撃ちターゲットID(atk_shoot用)
    const [shootTargetId, setShootTargetId] = useState<string>('')

    // デバッグ用：フェーズの日本語ラベル
    const phaseLabelMap: Record<string, string> = {
        mood: '【1】 ムード',
        station: '【2】 駅決定',
        stationEvent: '【3】 駅イベント',
        roll: '【4】 杯数抽選',
        draw: '【5】 カードドロー',
        useCards: '【6】 カード使用',
        progress: '【7】 成長判定',
        result: '【8】 結果表示',
    }
    const phaseLabel = phaseLabelMap[game.phase] ?? game.phase

    // 全員の杯数抽選(デバッグ用)
    const handleDebugRollAll = () => {
        runRollPhase()
    }

    // 処理中プレイヤーのみ杯数抽選(デバッグ用)
    const handleDebugRollCurrentPlayer = () => {
        if (game.phasePlayerIndex != null) {
            runRollPhaseForPlayer(game.phasePlayerIndex)
        }
    }

    // 代表プレイヤーのみカードドロー(デバッグ用)
    const handleDebugDrawForActive = () => {
        if (!activePlayer) return
        drawCard(activePlayer.id)
    }

    // 全員カードドロー(デバッグ用)
    const handleDebugDrawForAll = () => {
        drawToAll()
    }

    // カード使用(処理中プレイヤー)
    const handleUseCard = (cardId: CardId) => {
        if (!phasePlayer) return

        if (cardId === 'atk_shoot') {
            // 狙い撃ち：選択されたターゲットIDを渡す
            const targetId = shootTargetId || undefined
            useCard(phasePlayer.id, cardId, targetId)
            return
        }

        useCard(phasePlayer.id, cardId)
    }

    // 駅移動デバッグ用
    const handleDebugMoveStation = (direction: Direction, steps: number) => {
        moveStation(steps, direction)
    }

    // 駅イベント適用(デバッグ用)
    const handleDebugRunStationPhase = (direction: Direction, steps: number) => {
        runStationPhase(steps, direction)
    }

    // パッシブ解放(デバッグ用)
    const handleDebugUnlockPassive = () => {
        const targetId = debugPassiveTargetId || activePlayer?.id
        if (!targetId) return
        if (!debugPassiveId) return
        debugGrantPassive(targetId, debugPassiveId as PassiveId)
    }

    // 全プレイヤーの手札をすべて廃棄（デバッグ用）
    const handleDebugClearHands = () => {
        clearHands()
    }

    // 現在の杯数をXPへ反映(デバッグ用)
    const handleDebugApplyXp = () => {
        runProgressPhase()
    }

    // ホームへ戻る
    const handleGoHome = () => {
        setPage('home')
    }

    // カード使用フェーズかどうか判断するフラグ
    const isUseCardsPhase = game.phase === 'useCards'

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* ヘッダー */}
            <header className="flex items-center justify-between border-b pb-2">
                <div>
                    <h1 className="text-xl font-bold">環状線飲み【ターン進行】</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        ターン <span className="font-semibold">{game.turn}</span> /{' '}
                        現在フェーズ: <span className="font-semibold">{phaseLabel}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        代表プレイヤー:{' '}
                        <span className="font-semibold">
                            {activePlayer ? activePlayer.name : '未選択'}
                        </span>
                    </p>

                    <p className="text-sm text-gray-600">
                        操作中プレイヤー:{' '}
                        <span className="font-semibold">
                            {phasePlayer ? phasePlayer.name : '未選択'}
                        </span> 
                    </p>
                    <p className="text-sm text-gray-600">
                        ムード:{' '}
                        <span className="font-semibold">
                            {game.mood ?? '未選択'}
                        </span>
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <button
                        type="button"
                        className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                        onClick={handleGoHome}
                    >
                        ホームへ戻る
                    </button>
                    <div className="text-xs text-gray-500">
                        セーフティモード: {settings.safety ? 'ON(2杯上限)' : 'OFF(5杯上限)'}
                    </div>
                </div>
            </header>
            
            {/* メイン操作 */}
            <section className="grid gap-4 md:grid-cols-2">
                {/* フェーズ進行 */}
                <div className="rounded border p-3">
                    <h2 className="mb-2 text-sm font-semibold">フェーズ進行</h2>
                    <p className="mb-2 text-xs text-gray-600">
                        フェーズを1つずつ進める
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            onClick={proceedPhase}
                        >
                            フェーズを進める
                        </button>
                    </div>
                </div>

                {/* ムード操作 */}
                <div className="rounded border p-3">
                    <h2 className="mb-2 text-sm font-semibold">ムード操作(デバッグ)</h2>
                    <p className="mb-2 text-xs text-gray-600">
                        直接ムードを操作する（※本番はルーレットで決定)
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            onClick={spinMood}
                        >
                            ムードルーレット
                        </button>
                        <button
                            type="button"
                            className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                            onClick={clearMood}
                        >
                            ムードクリア
                        </button>
                    </div>
                </div>
            </section>

            {/* カード使用UI(処理中プレイヤー) */}
            <section className="rounded border p-3">
                <h2 className="mb-2 text-xs text-gray-600">カード使用(処理中プレイヤー)</h2>
                <p className="mb-2 text-xs text-gray-600">
                    【6】カード使用フェーズで使うUI
                </p>

                {!phasePlayer ? (
                    <p className="text-xs text-gray-600">
                        処理中プレイヤーがいません
                    </p>
                ) : phasePlayer.hand.length === 0 ? (
                    <p className="text-xs text-gray-600">
                        {phasePlayer.name} は現在カードを所持していません
                    </p>
                ) : (
                    <>
                        {!isUseCardsPhase && (
                            <p className="mb-2 text-xs text-red-500">
                                現在のフェーズは【6】ではありません
                            </p>
                        )}

                        <div className="flex flex-col gap-2">
                            {phasePlayer.hand.map((cardId, idx) => {
                                const isShoot = cardId === 'atk_shoot'

                                return(
                                    <div
                                        key={`${cardId}-${idx}`}
                                        className="flex flex-col gap-2 rounded border bg-white px-2 py-1 text-xs md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="font-mono">
                                            {cardId}
                                        </div>

                                        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
                                            {isShoot && (
                                                <select
                                                    className="rounded border px-2 py-1 text-xs"
                                                    value={shootTargetId}
                                                    onChange={(e) => setShootTargetId(e.target.value)}
                                                >
                                                    <option value="">
                                                        ターゲット未選択
                                                    </option>
                                                    {players.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <button
                                                type="button"
                                                disabled={!isUseCardsPhase}
                                                onClick={() => handleUseCard(cardId)}
                                                className={`rounded px-3 py-1 text-xs font-mono ${
                                                    isUseCardsPhase
                                                        ? `bg-purple-600 text-white hover:bg-purple-700`
                                                        : `cursor-not-allowed bg-gray-200 text-gray-400`
                                                    }`}
                                            >
                                                使用
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </section>

            {/* デバッグ操作群 */}
            <section className="rounded border p-3">
                <h2 className="mb-2 text-sm font-semibold">デバッグ操作</h2>
                <p className="mb-2 text-xs text-gray-600">
                    デバッグ用アイテム。本番では消す
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                        onClick={handleDebugRollAll}
                    >
                        全員の杯数ロール
                    </button>
                    <button
                        type="button"
                        className="rounded bg-emerald-100 px-3 py-1 text-sm hover:bg-emerald-200"
                        onClick={handleDebugRollCurrentPlayer}
                    >
                        操作中プレイヤーのみロール
                    </button>
                    <button
                        type="button"
                        className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
                        onClick={handleDebugDrawForActive}
                    >
                        代表プレイヤーが1枚ドロー
                    </button>
                    <button
                        type="button"
                        className="rounded bg-amber-100 px-3 py-1 text-sm hover:bg-amber-200"
                        onClick={handleDebugDrawForAll}
                    >
                        全員が1枚ずつドロー
                    </button>
                    <button
                        type="button"
                        className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
                        onClick={handleDebugApplyXp}
                    >
                        現在の杯数をXPに反映
                    </button>
                    <button
                        type="button"
                        className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                        onClick={handleDebugClearHands}
                    >
                        全員の手札を廃棄
                    </button>
                </div>

                {/* 駅移動(デバッグ) */}
                <div className="mt-4 border-t pt-3">
                    <h3 className="mb-1 text-xs font-semibold text-gray-700">駅移動(デバッグ)</h3>
                    <p className="mb-2 text-[11px] text-gray-500">駅の移動のみ実行。駅イベントは発生させない</p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* 時計回り */}
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-600">時計回り</p>
                            <div className='flex flex-wrap gap-1 justify-center'>
                                {[1, 2, 3, 4, 5, 6].map((steps) => (
                                    <button
                                        key={`cw-${steps}`}
                                        type="button"
                                        className="rounded bg-sky-100 px-2 py-1 text-xs hover:bg-sky-200"
                                        onClick={() => handleDebugMoveStation('cw' as Direction, steps)}
                                    >
                                        +{steps}駅
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 反時計回り */}
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-600">反時計回り</p>
                            <div className='flex flex-wrap gap-1 justify-center'>
                                {[1, 2, 3, 4, 5, 6].map((steps) => (
                                    <button
                                        key={`ccw-${steps}`}
                                        type="button"
                                        className="rounded bg-sky-100 px-2 py-1 text-xs hover:bg-sky-200"
                                        onClick={() => handleDebugMoveStation('ccw' as Direction, steps)}
                                    >
                                        -{steps}駅
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 駅移動 */}
                <div className="mt-4 border-t pt-3">
                    <h3 className="mb-1 text-xs font-semibold text-gray-700">駅移動(デバッグ)</h3>
                    <p className="mb-2 text-[11px] text-gray-500">
                        駅移動+駅イベント決定
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            className="rounded bg-teal-600 px-3 py-1 text-xs text-white hover:bg-teal-700"
                            onClick={() => handleDebugRunStationPhase('cw' as Direction, 1)}
                        >
                            時計回りに1駅+イベント
                        </button>
                        <button
                            type="button"
                            className="rounded bg-teal-100 px-3 py-1 text-xs hover:bg-teal-200"
                            onClick={() => handleDebugRunStationPhase('ccw' as Direction, 1)}
                        >
                            反時計回りに1駅+イベント
                        </button>
                    </div>
                </div>

                {/* パッシブ習得 */}
                <div className="mt-4 border-t pt-3">
                    <h3 className="mb-1 text-xs font-semibold text-gray-700">パッシブ習得</h3>
                    <p className="mb-2 text-[11px] text-gray-500">任意のプレイヤーに任意のパッシブを与える</p>

                    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                        <div className="flex items-center gap-1">
                            <span className="whitespace-nowrap">対象プレイヤー</span>
                            <select
                                className="rounded border px-2 py-1 text-xs"
                                value={debugPassiveTargetId}
                                onChange={(e) => setDebugPassiveTargetId(e.target.value)}
                            >
                                <option value="">代表プレイヤー(default)</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="whitespace-nowrap">PassiveId:</span>
                            <select 
                                className="rounded border px-2 py-1 text-xs"
                                value={debugPassiveId}
                                onChange={(e) => setDebugPassiveId(e.target.value)}
                            >
                                <option value="">---選択してください---</option>

                                {PASSIVES.map((node) => (
                                    <option key={node.id} value={node.id}>
                                        {node.id} : {node.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="rounded bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-700"
                            onClick={handleDebugUnlockPassive}
                        >
                            パッシブ付与
                        </button>
                    </div>
                </div>
            </section>

            {/* デバッグ情報 */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* game & event 情報 */}
                <div className="rounded border p-3 text-xs">
                    <h2 className="mb-2 text-sm font-semibold">ゲーム状態</h2>
                    <div className="space-y-1">
                        <div>
                            <span className="font-semibold">フェーズ:</span> {game.phase}
                        </div>
                        <div>
                            <span className="font-semibold">ムード:</span> {game.mood ?? 'null'}
                        </div>
                        <div>
                            <span className="font-semibold">現在駅:</span>{' '}
                            {game.currentStation ?? 'null'}
                        </div>
                        <div>
                            <span className="font-semibold">駅イベントID:</span>{' '}
                            {game.currentEvent ? game.currentEvent.id : 'null'}
                        </div>
                        <div>
                            <span className="font-semibold">最後に使用したカード:</span>{' '}
                            {game.lastUsedCard 
                            ? `${game.lastUsedCard.playerId}が${game.lastUsedCard.cardId} (turn ${game.lastUsedCard.usedAtTurn})`
                            : 'なし'}
                        </div>
                    </div>
                </div>

                {/* プレイヤー情報 */}
                <div className="rounded border p-3 text-xs">
                    <h2 className="mb-2 text-sm font-semibold">プレイヤー一覧</h2>
                    <div className="space-y-2">
                        {players.length === 0 && <p>プレイヤーがいません</p>}
                        {players.map((p) => (
                            <div key={p.id} className="rounded border px-2 py-1">
                                <div className="flex justify-between gap-2">
                                    <span className="font-semibold">{p.name}</span>
                                    <span className="text-[10px] text-gray-500 break-all">
                                        id: {p.id}
                                    </span>
                                </div>
                                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                                    <div>Li: {p.Li}</div>
                                    <div>Lv: {p.level}</div>
                                    <div>XP: {p.xp}</div>
                                    <div>SP: {p.sp}</div>
                                    <div>手札枚数: {p.hand.length}</div>
                                    <div className="break-words">手札: {p.hand.join(', ') || '-'}</div>
                                    <div className="col-span-2 break-words">
                                        パッシブID: {p.passives.join(', ') || '-'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* currentDrinks */}
                <div className="rounded border p-3 text-xs">
                    <h2 className="mb-2 text-sm font-semibold">今ターンの杯数</h2>
                    {game.currentDrinks.length === 0 ? (
                        <p>まだ杯数がロールされていません</p>
                    ) : (
                        <div className="space-y-2">
                            {game.currentDrinks.map((d) =>{
                                const p = players.find((pl) => pl.id === d.playerId)
                                return (
                                    <div key={d.playerId} className="rounded border px-2 py-1">
                                        <div className="flex justify-between gap-2">
                                            <span className="font-semibold break-words">
                                                {p ? p.name : d.playerId}
                                            </span>
                                            <span>final: {d.final}</span>
                                        </div>
                                        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                                            <div>base: {d.base}</div>
                                            <div>moodMod: {d.moodMod}</div>
                                            <div>eventMod: {d.eventMod}</div>
                                            <div>passiveMod: {d.passiveMod}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* デュアルロール候補 */}
                {game.dualRollPending && (
                    <div className="rounded border border-purple-300 bg-purple-50 p-3 text-xs">
                        <h2 className="mb-1 text-sm font-semibold text-purple-800">
                            デュアルロール選択中
                        </h2>
                        <p className="mb-1">
                            プレイヤー: {
                                players.find((p) => p.id === game.dualRollPending!.playerId)?.name ?? game.dualRollPending.playerId
                            }
                        </p>
                        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded bg-white p-2">
                                <div className="font-semibold">候補A</div>
                                <div>杯数: {game.dualRollPending.optionA.final}</div>
                            </div>
                            <div className="rounded bg-white p-2">
                                <div className="font-semibold">候補B</div>
                                <div>杯数: {game.dualRollPending.optionB.final}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                                onClick={() => resolveDualRoll('A')}
                            >
                                候補Aを採用
                            </button>
                            <button
                                type="button"
                                className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                                onClick={() => resolveDualRoll('B')}
                            >
                                候補Bを採用
                            </button>
                        </div>
                        <p className="mt-1 text-[10px] text-purple-700">
                            ※候補を選ぶと currentDrinks に反映
                        </p>
                    </div>
                )}
            </section>

        </div>
    )    
}