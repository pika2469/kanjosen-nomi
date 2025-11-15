import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Player, Settings } from '../types/game'

// DBクラス（スキーマ定義）
export class NomiDB extends Dexie {
    settings!: Table<Settings, string>
    players!: Table<Player, string>

    constructor() {
        super('kanjosen-nomi-db')
        this.version(1).stores({
            // テーブル作成
            settings: '&id', // 主キーid固定
            players: '&id',
        })
    }
}

// 実行時にDBインスタンスを作成
const db = new NomiDB()

// ------- API: Settings --------
// 設定(settings)をブラウザから読み込む関数
export async function loadSettings(): Promise<Settings> {
    
    // Dexieでsettingsテーブルからid === 'default'のデータを取得
    // データが無い場合はデフォルト値を使用。s ?? (sがnullの時の処理)
    const s = await db.settings.get('default')
    return (
        s ?? {
            allowDuplicateStations: true,
            sound: true,
            safety: true,
            id: 'default'
        } as Settings & { id: 'default' }
    ) 
}

// 設定(settings)をブラウザに保存する関数
export async function saveSettings(next: Settings) {
    // 引数のnextを展開、引数にはidが含まれていないので型チェックのエラー回避のためにanyで無効化、idを上書き
    await db.settings.put({ ...(next as any), id: 'default' })
}


// ------- API: Players --------
// DBからplayersテーブルの全レコードを配列で取得
export async function loadPlayers(): Promise<Player[]> {
    const all = await db.players.toArray()
    return all
}

// プレイヤーが新規なら追加、既存なら上書き
export async function upsertPlayer(p: Player) {
    await db.players.put(p)
}

// プレイヤー削除
export async function removePlayer(id: string) {
    await db.players.delete(id)
}

// プレイヤー情報を一括置き換え
export async function replacePlayers(ps: Player[]) {
    await db.players.clear()
    await db.players.bulkPut(ps)
}

// IndexedDB初期化（全削除→初期化）
export async function resetAll() {
    await db.players.clear()
    await db.settings.clear()
}