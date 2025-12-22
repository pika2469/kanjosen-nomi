// React本体とDOM描画ライブラリを読み込み
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Tailwindのスタイル適用
import './index.css'

// アプリのメインコンポーネント
import App from './App'

// ルート要素を取得し、Reactアプリを描画
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
