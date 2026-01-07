## Nazare基準の個別カウンセリングチャットテンプレート

このメモは `/components/GeneralCounselorChatClient.tsx`（ナザレ設定）をベースに、今後の個別カウンセリングチャットを同じクオリティで実装するための構造指針です。

### 1. レイアウト全体
- ルート要素：`<div className="relative w-full border-t border-slate-200" style={gradientStyle}>`
  - ページ最上部に薄いグレーボーダーを入れてナビゲーションと明確に分離。
  - `gradientStyle` は `linear-gradient(135deg, gradientFrom, gradientVia?, gradientTo)` を適用し、常に `min/height/maxHeight = calc(100vh - 4rem)` を維持してナビ下を完全に埋める。
- 背景に半透明のグラデーションを敷くことで「柔らかい光の箱」を形成し、上部通知（オフライン等）が浮かぶ余地を確保。

### 2. デスクトップ左サイドバー（洗練されたカード束）
- `<aside className="hidden w-80 rounded-[30px] border border-white/30 bg-white/70 p-5 backdrop-blur md:flex">` を基準にする。
- 内部構成：
  1. グラデーションボタン `newChatButtonClasses`（`border-transparent`＋`shadow-lg`）
  2. 共有ボタン（`variant="outline"` で白地）
  3. セッションカード群
     - アクティブ時：`border-transparent text-white` に counselor 固有 `config.theme.activeBackground`
     - 非アクティブ時：`config.theme.cardBorder + bg-white`
     - 削除ボタンは `config.theme.deleteButtonText/hover` で統一
- 空状態・スケルトンも丸角 (`rounded-3xl`) と柔らかい背景 (`bg-white/70`) を使って「紙束」の連続性を保つ。

### 3. ヒーローヘッダー（自己紹介＋アイコン）
- `<header>` は `rounded-[32px] border border-white/40 bg-white/90 shadow-2xl` のメインラッパ内に存在。
- 構造：
  - 左：ハンバーガー（モバイル用）＋テキストスタック
    - `subtitle`：`text-xs font-semibold uppercase tracking-[0.3em]`、テーマ色クラス（例：ナザレは紫）
    - `name`：`text-2xl font-bold`
    - `description`：`text-sm`
  - 直下の行は空 (`<div className="mt-3 ..." />`) にしてガイドバッジを表示しない。
  - 右：`<Image>`（56x56, `rounded-2xl`）のみ。履歴チップや統計バッジは表示しない。

### 4. プロンプト＆メッセージエリア
- 初回用プリセット：`border-b` セクションに「すぐに話したいことを選べます」＋ pill ボタン群。
- メッセージ領域：
  - 空状態：センターに2本のメッセージ（ベース色の `config.theme.promptText`）。
  - `messages.map` ではユーザ／アシスタント双方が `rounded-3xl`、影付き、テーマ色 `config.theme.bubble*` を参照。
  - アシスタントの `pending` 表示は `Loader2`＋`config.thinkingMessages[currentThinkingIndex]` を行内で表示。

### 5. ローディング／エラー挙動
- `showLoader` 中は `Loader2` をグラデーション背景の中央に表示。
- エラーは `absolute inset-x-6 top-4` に白背景のカードで重ね、「プレーンなモーダル風トースト」に統一。

### 6. コンポーザー（送信エリア）
- `composerRef` ラッパ：`border-t` にテーマの `sectionBorder` を再利用し、`bg-white px-4 py-3`。
- `textarea` は `rounded-2xl`, `border-2`, `config.theme.inputBorder/inputBg/inputPlaceholder` を組み合わせてテーマ色の丸み枠線を作る。
  - 共通クラスに `focus:ring-2 focus:ring-offset-0` を仕込み、`config.theme.inputBorder` 内の `focus:border-*` と `focus:ring-*` で counselor 固有の発光感を統一。
- 送信ボタン：`Button` + `style={{ backgroundColor: config.theme.accent }}` を採用し、どの counselor でも同じ動作。

### 7. モバイル動作
- サイドバーは `fixed inset-0` のシートとして再利用（下部スライド）。
- 全画面背景は PC 同様の `gradientStyle` が body を満たし、上部通知やモーダルにも透過感を残す。
- モバイル内のセッションカード／ボタンも同じ `newChatButtonClasses` を使い、丸みとグラデーションを統一。

### 8. 重点ポイント
1. **左サイドバーの質感**：丸角＋半透明＋カード群という「紙束」感を損なわない。shadow を強くしすぎない。
2. **新しいチャットボタン**：全 counselor 固有のグラデーション（`config.theme.newChatButton`）を `variant="default" + border-transparent` で必ず適用。
3. **ヘッダー自己紹介**：`subtitle / name / description / icon` のみ。ガイドバッジや統計タグは入れない。
4. **ローディング表現**：`Loader2` + カスタム文言で自然な待機フィードバックを提供。
5. **モバイルの包み込み**：背景グラデーション＋丸みカード（LLMバブル、モバイルサイドバー）が一貫して柔らかく見えるようにする。

このテンプレに沿って各 counselor の `ChatConfig`（テーマ色・文章・thinking メッセージなど）を差し替えるだけで、ナザレと同品質の個別チャットが量産できます。
