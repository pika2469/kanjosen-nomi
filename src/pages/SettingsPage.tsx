import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

export function SettingsPage() {
    const { settings, setSettings, resetAllData } = useGameStore()

    return (
        <div className="space-y-4">
            <section>
                <h2 className="text-xl font-bold mb-1">設定</h2>
                <p className="text-sm text-gray-600">
                    各種設定を行うページ
                </p>
            </section>

            <section className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                    <div className="flex flex-col text-left">
                        <div className="font-medium">駅重複</div>
                        <div className="text-xs text-graY-500">同じ駅を複数回訪問することを許可します。</div>
                    </div>
                    <Button
                        size="sm"
                        variant={settings.allowDuplicateStations ? 'default' : 'outline'}
                        onClick={() => setSettings({ allowDuplicateStations: !settings.allowDuplicateStations })}
                    >
                        {settings.allowDuplicateStations ? 'あり' : 'なし'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                    <div className="flex flex-col text-left">
                        <div className="font-medium">サウンド</div>
                        <div className="text-xs text-graY-500">BGMや効果音を有効にします</div>
                    </div>
                    <Button
                        size="sm"
                        variant={settings.sound ? 'default' : 'outline'}
                        onClick={() => setSettings({ sound: !settings.sound })}
                    >
                        {settings.sound ? 'ON' : 'OFF'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                    <div className="flex flex-col text-left">
                        <div className="font-medium">セーフティモード</div>
                        <div className="text-xs text-graY-500">飲酒杯数を減らします</div>
                    </div>
                    <Button
                        size="sm"
                        variant={settings.safety ? 'default' : 'outline'}
                        onClick={() => setSettings({ safety: !settings.safety })}
                    >
                        {settings.safety ? 'ON' : 'OFF'}
                    </Button>
                </div>
            </section>

            <section className="pt-2">
                <Button variant="destructive" className="w-full" onClick={resetAllData}>
                    データリセット
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                    プレイヤー情報・設定をすべてリセットします。
                </p>
            </section>
        </div>
    )
}
