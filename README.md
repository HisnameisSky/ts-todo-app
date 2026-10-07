# 📝 TypeScript Todo App

Vite + TypeScript で構築した、フィルタリング・アニメーション・LocalStorage データ永続化に対応したインタラクティブな ToDo 管理アプリケーションです。


🌐 **Live Demo:** [[ts-todo-app-snowy.vercel.app](https://ts-todo-app-snowy.vercel.app/)]

---

## ✨ 主な機能

- **タスク管理 (CRUD):** タスクの追加・完了切り替え・削除機能
- **動的フィルタリング:** 「すべて」「未完了」「完了済み」のリアルタイム絞り込み
- **データの永続化:** `localStorage` を活用し、ページリロード後も状態を維持
- **UI/UX アニメーション:** CSS `@keyframes` と TypeScript の非同期処理（`setTimeout`）による滑らかな削除・切り替えアニメーション
- **レスポンシブデザイン:** モバイル・デスクトップ対応

---

## 🛠 使用技術 (Tech Stack)

- **Language:** TypeScript
- **Bundler:** Vite
- **Markup / Styling:** HTML5, CSS3 (Flexbox, CSS Variables)
- **Deployment:** Vercel

---

## 💡 こだわったポイント・設計上の工夫

1. **型安全な設計 (Type Safety)**
   - `Todo` インターフェースや Discriminated Unions (`FilterType`) を導入し、タスク状態やフィルター条件を型安全に管理しました。

2. **UIアニメーションと非同期処理の同期**
   - 削除処理時に DOM を即時消去するのではなく、CSS アニメーション完了（250ms）を待ってから配列を更新・再描画することで、心地よいユーザー体験を実現しました。

3. **堅牢なデータ保存 (LocalStorage)**
   - JSON のパースエラーに備えて `try-catch` によるエラーハンドリングを実装し、壊れたデータによるアプリのクラッシュを防止しました。

---

## 🚀 ローカルでの実行方法

```bash
# 1. リポジトリのクローン
git clone [https://github.com/HisnameisSky/ts-todo-app.git]

# 2. 依存関係のインストール
cd ts-todo-app
npm install

# 3. 開発サーバーの起動
npm run dev<img width="424" height="317" alt="スクリーンショット 2026-10-04 5 50 50" src="https://github.com/user-attachments/assets/a1c9c901-478e-44bd-bbf2-18dfbe582452" />
