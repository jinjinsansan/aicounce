# シッダールタ（仏教カウンセラー）セットアップガイド

このドキュメントは、シッダールタの完全なセットアップに必要な手順を説明します。

## 🚀 デプロイ前の必須タスク

### 1. Supabaseマイグレーションの実行

SupabaseダッシュボードまたはCLIでマイグレーションを実行してください：

```bash
# CLIを使用する場合
npx supabase db push

# または、Supabaseダッシュボードで以下のファイルを実行
# supabase/migrations/20260106_add_siddhartha_tables.sql
```

このマイグレーションは以下を作成します：
- `siddhartha_sessions` テーブル（openai_thread_idカラム含む）
- `siddhartha_messages` テーブル
- RLSポリシー（全CRUD操作）
- RAG検索関数：
  - `match_siddhartha_knowledge()` - 基本RAG検索
  - `match_siddhartha_knowledge_sinr()` - 親子チャンク検索

### 2. Supabase型定義の再生成

マイグレーション実行後、TypeScriptの型定義を再生成してください：

```bash
# Supabaseプロジェクトにログイン
npx supabase login

# 型定義を生成（PROJECT_IDを実際のIDに置き換えてください）
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

生成後、以下のファイルから `as any` を削除してください：
- `app/api/siddhartha/chat/route.ts`
- `app/api/siddhartha/sessions/route.ts`
- `app/api/siddhartha/sessions/[sessionId]/route.ts`
- `app/api/siddhartha/sessions/[sessionId]/messages/route.ts`
- `app/api/siddhartha/phase/route.ts`
- `lib/siddhartha/rag.ts`

### 3. RAGデータのアップロード

仏教経典の知識ベースをデータベースにアップロードします：

```bash
cd ai-counselor-site
npx tsx scripts/siddhartha-rag/upload.ts
```

このスクリプトは以下をアップロードします：
- 100個の親チャンク（仏教経典の概要）
- 215個の子チャンク（具体的な実践とカウンセリング場面）
- 各チャンクのembedding（OpenAI text-embedding-3-small）

**注意:** アップロードには5-10分かかる場合があります。

## 📋 オプションタスク

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定できます（オプション）：

```bash
# シッダールタを有効化（デフォルトで有効）
SIDDHARTHA_AI_ENABLED=true

# OpenAI Assistant IDを使用する場合（オプション）
SIDDHARTHA_ASSISTANT_ID=asst_xxxxx

# OpenAI API Key（必須・既に設定済みの場合はスキップ）
OPENAI_API_KEY=sk-xxxxx
```

## ✅ セットアップ確認

以下の手順でセットアップが正しく完了したか確認してください：

### 1. データベース確認

Supabase SQLエディタで以下を実行：

```sql
-- テーブルが作成されているか確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('siddhartha_sessions', 'siddhartha_messages');

-- RAG関数が存在するか確認
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'match_siddhartha%';

-- RAGデータがアップロードされているか確認
SELECT COUNT(*) FROM rag_documents WHERE counselor_id = 'siddhartha';
-- 期待値: 約315レコード（100親 + 215子）
```

### 2. ビルド確認

```bash
cd ai-counselor-site
npm run build
```

型エラーがないことを確認してください。

### 3. 動作確認

デプロイ後、以下を確認してください：

1. **個別カウンセリング**
   - https://www.mentalai.team/counselor/chat/siddhartha にアクセス
   - アンバー/ゴールド色のUIが表示される
   - メッセージを送信して応答が返る

2. **チームカウンセリング**
   - https://www.mentalai.team/team にアクセス
   - シッダールタが参加者リストに表示される
   - シッダールタを選択してチャット可能

3. **RAG検索**
   - 「四聖諦について教えてください」などの質問で経典の引用が返る
   - 応答に仏教用語（慈悲、智慧、中道など）が含まれる

## 🎨 実装詳細

### UIテーマ

- **カラー:** アンバー/ゴールド（仏教の袈裟を象徴）
  - 背景: `#fffbeb` (amber-50)
  - テキスト: `#92400e` (amber-900)
  - アクセント: `#f59e0b` (amber-500)

### システムプロンプト

慈悲・智慧・中道の基本姿勢に基づく仏教カウンセリング：
- 四聖諦（苦・集・滅・道）
- 八正道（正見・正思惟等）
- 六波羅蜜（布施・持戒等）
- 禅語と実践瞑想

詳細: `lib/team/prompts/siddhartha.ts`

### RAGデータソース

- **親チャンク（100個）:** 般若心経、法華経、法句経、観音経、浄土三部経等
- **子チャンク（215個）:** 具体的なカウンセリング場面と実践方法
- **メタデータ:** scripture（経典名）、theme（テーマ）、situation（状況タグ）

ソースデータ: `data/buddha-rag/buddha_chunks_final/`

## 🐛 トラブルシューティング

### 問題: 型エラーが残っている

**解決策:** Supabase型定義を再生成し、`as any`を削除してください。

### 問題: RAG検索が機能しない

**確認事項:**
1. マイグレーションで関数が作成されているか
2. RAGデータがアップロードされているか
3. OpenAI API Keyが設定されているか

### 問題: チャットが表示されない

**確認事項:**
1. `SIDDHARTHA_AI_ENABLED` が有効か
2. `OPENAI_API_KEY` が設定されているか
3. RLSポリシーが正しく設定されているか

## 📚 関連ファイル

### コンポーネント
- `components/SiddharthaChatClient.tsx` - メインUIコンポーネント

### API
- `app/api/siddhartha/chat/route.ts` - チャットエンドポイント
- `app/api/siddhartha/sessions/route.ts` - セッション一覧
- `app/api/siddhartha/phase/route.ts` - フェーズインサイト

### ライブラリ
- `lib/siddhartha/env.server.ts` - 環境変数
- `lib/siddhartha/openai.ts` - OpenAIクライアント
- `lib/siddhartha/rag.ts` - RAG検索ロジック
- `lib/team/prompts/siddhartha.ts` - システムプロンプト

### データベース
- `supabase/migrations/20260106_add_siddhartha_tables.sql` - マイグレーション

### スクリプト
- `scripts/siddhartha-rag/upload.ts` - RAGデータアップロード

---

**最終更新:** 2026-01-06
