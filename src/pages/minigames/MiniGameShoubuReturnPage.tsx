import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function MiniGameShoubuReturnPage() {
  const { players, finalizeShoubuTime } = useGameStore()

  return (
    <div className="space-y-4">
      <section>
        <p className="text-[11px] font-semibold text-sky-500">
          MINIGAME / Shoubu Time
        </p>
        <h2 className="text-xl font-bold mb-1">敗者を選択</h2>
        <p className="text-sm text-gray-600">
          ミニゲームで負けたプレイヤーを1人選ぶと、そのプレイヤーに +1杯 してカード使用に戻ります。
        </p>
      </section>

      <section className="space-y-2">
        {players.map((p) => (
          <Button
            key={p.id}
            className="w-full"
            onClick={() => finalizeShoubuTime(p.id)}
          >
            {p.name}
          </Button>
        ))}
      </section>

      <p className="text-xs text-gray-500">
        ※ 選択後は自動でカード使用フェーズへ戻ります。
      </p>
    </div>
  )
}
