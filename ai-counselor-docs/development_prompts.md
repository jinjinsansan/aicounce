# AIカウンセラーサイト 開発プロンプト

## Phase 1: 基盤構築 (1-2週間)

### 1.1 Next.jsプロジェクトの初期化

**プロンプト:**

```
Next.jsプロジェクトをセットアップしてください。

- フレームワーク: Next.js 14+
- 言語: TypeScript
- スタイリング: TailwindCSS
- プロジェクト名: `ai-counselor-site`

以下のコマンドを実行し、プロジェクトを初期化してください。

```bash
npx create-next-app@latest ai-counselor-site --typescript --tailwind
```

プロジェクトが作成されたら、基本的なファイル構造を確認し、不要なサンプルコードを削除してください。
```

### 1.2 Supabaseプロジェクトのセットアップと連携

**プロンプト:**

```
Supabaseプロジェクトを新規作成し、Next.jsアプリと連携させてください。

1.  **Supabaseプロジェクト作成**: [supabase.com](https://supabase.com) にて、新規プロジェクトを作成します。
2.  **APIキーの取得**: プロジェクト設定からAPI URLと`anon`キー、`service_role`キーを取得します。
3.  **環境変数の設定**: Next.jsプロジェクトのルートに`.env.local`ファイルを作成し、以下の通り設定します。

    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```

4.  **Supabaseクライアントの初期化**: `lib/supabase.ts`を作成し、Supabaseクライアントを初期化するコードを記述します。

    ```typescript
    // lib/supabase.ts
    import { createClient } from '@supabase/supabase-js';
    import { Database } from '@/types/supabase'; // 型定義は後で作成

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    ```
```

### 1.3 データベーススキーマの作成

**プロンプト:**

```
仕様書の「4.1 Supabaseスキーマ」に基づいて、Supabaseのテーブルを全て作成してください。

-   `users`
-   `counselors`
-   `conversations`
-   `messages`
-   `rag_documents`
-   `rag_chunks`
-   `rag_search_logs`

SQLエディタで以下のDDLを実行し、各テーブルを作成してください。また、`rag_chunks`テーブルの`embedding`カラムに対して`ivfflat`インデックスを作成してください。

```sql
-- 各テーブルのCREATE TABLE文をここに記述
-- (仕様書からコピー)
```

次に、SupabaseのCLIを使用して、これらのテーブル定義からTypeScriptの型を自動生成します。

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```
```
_content_

## Phase 2: フロントエンド (2-3週間)

### 2.1 ホームページとカウンセラー選択画面の作成

**プロンプト:**

```
仕様書の「6.1.1 ホームページ」と「6.2 デザインシステム」に基づいて、ホームページを作成してください。

1.  **カウンセラー一覧の取得**: `counselors`テーブルから全カウンセラーの情報を取得するAPIルート (`app/api/counselors/route.ts`) を作成します。
2.  **カウンセラーカードコンポーネント**: `components/CounselorCard.tsx` を作成し、カウンセラーの情報を表示するカードを実装します。仕様書の「補足資料J.5 カウンセラーカード」を参考にしてください。
3.  **ホームページ (`app/page.tsx`)**: 取得したカウンセラー一覧をグリッドレイアウトで表示します。各カードをクリックすると、対応するカウンセラー詳細ページ (`/counselor/[id]`) に遷移するようにしてください。
4.  **カウンセラー詳細ページ (`app/counselor/[id]/page.tsx`)**: 選択されたカウンセラーの詳細情報を表示し、「チャットを開始する」ボタンを設置します。ボタンをクリックするとチャットページ (`/counselor/chat/[id]`) に遷移します。
```

### 2.2 チャットインターフェースの作成

**プロンプト:**

```
仕様書の「6.1.3 チャットページ」と「補足資料J.4 チャットUI」に基づいて、チャットインターフェースを実装してください。

1.  **状態管理**: `zustand` を使用して、メッセージリスト、入力中のメッセージ、送信状態などを管理するストアを作成します。
2.  **メッセージ表示コンポーネント (`components/MessageBubble.tsx`)**: ユーザーとAIの発言を区別して表示するコンポーネントを作成します。
3.  **チャットインターフェースコンポーネント (`components/ChatInterface.tsx`)**: メッセージの送受信ロジックを実装します。送信ボタンがクリックされたら、`/api/chat`エンドポイントにリクエストを送信します。
4.  **チャットページ (`app/counselor/chat/[id]/page.tsx`)**: 上記コンポーネントを組み合わせてチャットページを完成させます。過去の会話履歴を`messages`テーブルから取得して表示する機能も実装してください。
```

## Phase 3: LLM統合 (1-2週間)

### 3.1 チャットAPIエンドポイントの作成

**プロンプト:**

```
仕様書の「8.1 チャットAPI」に基づいて、`/api/chat/route.ts`を作成してください。

このエンドポイントは以下の処理を行います。

1.  **リクエスト受信**: ユーザーメッセージと会話ID、カウンセラーIDを受け取ります。
2.  **カウンセラー情報取得**: `counselors`テーブルから、指定されたカウンセラーのシステムプロンプトや使用するモデルの情報を取得します。
3.  **LLM呼び出し**: 取得した情報をもとに、対応するLLM（OpenAI, Gemini, Claude, Deepseek）のAPIを呼び出します。
4.  **RAG処理の呼び出し(Phase 4で実装)**: `rag_enabled`がtrueの場合、RAG処理を呼び出してコンテキストを取得し、プロンプトに含めます。
5.  **会話履歴の保存**: ユーザーのメッセージとAIの応答を`messages`テーブルに保存します。
6.  **レスポンス返却**: AIの応答をクライアントに返します（ストリーミング対応も検討）。

まずはRAGなしの基本的なLLM呼び出し部分を実装してください。
```

### 3.2 マルチLLM対応

**プロンプト:**

```
`lib/llm.ts`を作成し、複数のLLMを抽象化して呼び出すためのラッパー関数を実装してください。

-   `callOpenAI(prompt, model)`
-   `callGemini(prompt, model)`
-   `callClaude(prompt, model)`
-   `callDeepseek(prompt, model)`

チャットAPIでは、カウンセラーの`model_type`に応じてこれらの関数を動的に呼び分けるようにしてください。
APIキーは環境変数から読み込むようにし、直接コードに記述しないでください。
```

## Phase 4: RAG実装 (2-3週間)

### 4.1 RAG処理の実装

**プロンプト:**

```
仕様書の「5. RAG統合設計」と「補足資料G RAG統合運用ガイド」に基づいて、RAG処理を`lib/rag.ts`に実装してください。

1.  **ベクトル検索関数**: SupabaseのRPC（Remote Procedure Call）として、ベクトル検索用の関数を作成します。仕様書「補足資料C.3」を参考にしてください。
2.  **RAGコンテキスト取得関数 (`getContext`)**: 以下の処理を行う関数を実装します。
    a.  ユーザーメッセージをOpenAI Embedding APIでベクトル化します。
    b.  作成したRPCを呼び出して、関連する`child_chunk`を検索します。
    c.  検索された`child_chunk`の`parent_chunk_id`を元に、`parent_chunk`を取得します。
    d.  取得したチャンクを整形し、LLMに渡すコンテキスト文字列を生成します。
3.  **チャットAPIへの統合**: `/api/chat/route.ts`を修正し、カウンセラーの`rag_enabled`がtrueの場合に`getContext`関数を呼び出し、取得したコンテキストをシステムプロンプトに組み込むように変更します。
```

### 4.2 RAGデータ挿入スクリプトの作成

**プロンプト:**

```
YouTubeの文字起こしテキストから、親子チャンク構造を持つRAGデータを作成し、Supabaseに挿入するスクリプトを作成してください。

-   **入力**: テキストファイル
-   **処理**:
    1.  テキストを適切なサイズの親チャンクに分割します。
    2.  各親チャンクをさらに文や段落単位の子チャンクに分割します。
    3.  各チャンクをOpenAI Embedding APIでベクトル化します。
    4.  `rag_documents`と`rag_chunks`テーブルにデータを挿入します。
-   **実行方法**: コマンドラインから実行できるようにしてください。

```bash
node scripts/insert-rag-data.js --file <path-to-transcript.txt> --counselor-id <counselor-uuid>
```

このスクリプトを使って、各専門分野のRAGデータを後から追加できるように準備してください。
```

## Phase 5: テスト・最適化 (1-2週間)

### 5.1 ユニットテストと統合テスト

**プロンプト:**

```
JestとReact Testing Libraryを導入し、主要なコンポーネントとAPIエンドポイントのテストを作成してください。

-   **コンポーネントテスト**: `CounselorCard`, `ChatInterface`, `MessageBubble`などのUIコンポーネントが正しくレンダリングされ、インタラクションに反応することを確認します。
-   **APIテスト**: `/api/chat`エンドポイントに対して、モックリクエストを送信し、期待される応答（LLMの応答、エラーハンドリング）が返ってくることを確認します。
-   **RAGテスト**: RAG処理が正しくコンテキストを生成し、LLMの応答品質が向上することを確認するテストケースを作成します。
```

### 5.2 パフォーマンス最適化

**プロンプト:**

```
LighthouseやVercel Analyticsを使用して、アプリケーションのパフォーマンスを測定し、ボトルネックを特定・改善してください。

-   **フロントエンド**: 画像の最適化、コンポーネントの遅延読み込み（`next/dynamic`）、不要な再レンダリングの防止（`React.memo`）などを検討します。
-   **バックエンド**: APIの応答時間、特にRAG検索とLLM呼び出しの時間を計測し、キャッシュ戦略やインデックスの最適化を検討します。
-   **データベース**: Supabaseのクエリパフォーマンスを確認し、必要に応じてインデックスを追加・修正します。
```

## Phase 6: リリース (1週間)

### 6.1 Vercelへのデプロイ

**プロンプト:**

```
GitHubリポジトリとVercelプロジェクトを連携させ、CI/CDパイプラインを構築してください。

1.  **リポジトリ作成**: プロジェクトをGitHubにプッシュします。
2.  **Vercelプロジェクト作成**: Vercelで新規プロジェクトを作成し、GitHubリポジトリをインポートします。
3.  **環境変数の設定**: Vercelのプロジェクト設定画面で、`.env.local`に設定した全ての環境変数を登録します。
4.  **デプロイ**: `main`ブランチへのプッシュをトリガーとして、自動的にビルドとデプロイが実行されるように設定します。
5.  **カスタムドメイン**: 必要であれば、カスタムドメインを設定します。

デプロイ後、本番環境で全機能が正常に動作することを確認してください。
```
