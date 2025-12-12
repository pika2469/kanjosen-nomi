import { useGameStore } from '@/store/gameStore'
import { STATIONS } from '@/stations'

// 駅イベント ID → 表示用テキスト
const EVENT_TEXTS: Record<
  string,
  {
    title: string
    summary: string
    detail: string
  }
> = {
  // 繁華街
  downtown_rep_plus2_others_plus1: {
    title: '繁華街：代表ドカ飲みタイム',
    summary: '代表+2杯、その他の全員+1杯',
    detail: 'にぎやかな繁華街に到着！代表プレイヤーはさらに+1杯多く飲むことになります。',
  },
  downtown_all_plus1: {
    title: '繁華街：みんなでワイワイ',
    summary: '全員+1杯',
    detail: 'テンション高めのエリアに突入。全員の最終杯数が+1杯されます。',
  },

  // 水辺
  waterside_others_minus1: {
    title: '水辺：まったりタイム',
    summary: '代表以外の全員-1杯',
    detail: '風が気持ちいい水辺スポット。代表以外のプレイヤーは1杯セーブできます。',
  },
  waterside_rep_minus1: {
    title: '水辺：代表クールダウン',
    summary: '代表のみ-1杯',
    detail: '代表プレイヤーは一息ついて、最終杯数が1杯減少します。',
  },

  // 下町
  shitamachi_all_plus1: {
    title: '下町：ほろ酔い商店街',
    summary: '全員+1杯',
    detail: '人情味あふれる下町で一杯。全員の最終杯数が+1杯されます。',
  },
  shitamachi_rep_plus1: {
    title: '下町：代表サービス',
    summary: '代表のみ+1杯',
    detail: 'お店の人から代表へサービス一杯。代表プレイヤーだけ最終杯数が+1杯されます。',
  },

  // 乗換（カード系）
  transfer_rep_draw_plus1: {
    title: '乗換：代表ボーナスドロー',
    summary: '代表プレイヤーが追加でカード+1枚ドロー',
    detail: '乗換駅で時間調整中。代表プレイヤーはこのターン、カードを1枚多く引きます。',
  },
  transfer_rep_skip_action: {
    title: '乗換：代表アクション停止',
    summary: '代表プレイヤーはこのターン、カード使用不可',
    detail: '乗換でバタバタしている代表プレイヤー。このターンはカードを使用できません。',
  },
}

export default function StationEventPage() {
  const { game, players } = useGameStore()
  const activePlayer = players[game.activePlayerIndex] ?? null

  const station = STATIONS.find((s) => s.id === game.currentStation)
  const event = game.currentEvent ?? null

  const eventId = event?.id ?? ''
  const eventText = EVENT_TEXTS[eventId]

  return (
    // div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4"
    <div className="flex h-full flex-col gap-4">
        {/* ヘッダー */}
        <header className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1 text-left">
                    <p className="text-[11px] font-semibold text-sky-500">
                        STEP 3 / Station Event
                    </p>
                    <h1 className="text-lg font-bold text-slate-900">
                        駅イベントが発生！
                    </h1>
                </div>
                {activePlayer && (
                    <div className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-white">
                        代表: {activePlayer.name}
                    </div>
                )}        
            </div>   
            <p className="text-xs text-slate-500 text-left">
                到着した駅の雰囲気にあわせて、このターンの杯数にボーナスやペナルティがかかります。
            </p>
        </header>


      {/* メインカード */}
      <section className="rounded-3xl bg-white/80 p-5 shadow-md">
        {/* 駅情報 */}
        <div className="mb-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500">到着した駅</p>
          <p className="text-lg font-semibold text-gray-900">
            {station ? station.name : '駅未決定'}
          </p>
          <p className="text-xs text-gray-500">
            フェーズ: {game.phase} / ターン: {game.turn}
          </p>
        </div>

        {/* イベント内容 */}
        {event ? (
          <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">今回のイベント</p>
              {/* デバッグ用に ID を小さく表示 */}
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-gray-600">
                id: {event.id}
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-gray-900">
                {eventText?.title ?? 'イベント発生'}
              </p>
              <p className="mt-1 text-xs font-medium text-amber-700">
                {eventText?.summary ?? 'この駅では杯数に何らかの補正がかかります。'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {eventText?.detail ??
                  '詳細テキストは今後のアップデートで追加されます。ひとまずデバッグ用としてIDのみ表示しています。'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500">イベント未決定</p>
            <p className="text-sm text-gray-700">
              このターンの駅イベントはまだ決まっていません。デバッグ用に一度駅フェーズからやり直してください。
            </p>
          </div>
        )}
      </section>

      {/* デバッグ枠（MoodPage / StationPage と同じ位置の想定） */}
      <section className="rounded-3xl bg-white/70 px-4 py-3 text-xs text-gray-600 shadow-sm">
        <p className="mb-1 font-semibold text-gray-500">Debug</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>現在の駅</span>
            <span>{station ? station.name : '未決定'}</span>
          </div>
          <div className="flex justify-between">
            <span>イベントID</span>
            <span>{event ? event.id : 'なし'}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
