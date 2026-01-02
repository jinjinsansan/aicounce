# テープ式心理学 AIカウンセラーサイト開発仕様書

**プロジェクト名**: テープ式心理学 AIカウンセラーサイト  
**バージョン**: 1.0  
**作成日**: 2026年1月3日  
**開発フレームワーク**: Claude Code  
**デプロイメント**: Vercel + Supabase  

---

## 1. プロジェクト概要

### 1.1 プロジェクトの目的

テープ式心理学に基づいた複数の専門分野のAIカウンセラーを統合したプラットフォームを構築する。既存のミシェル心理学チャット（https://namisapo.app/michelle）の実装経験を活かし、複数のカウンセリング専門分野を提供する包括的なAIカウンセラーサイトを開発する。

### 1.2 主要な特徴

- **複数専門分野対応**: 8種類のAIカウンセラーペルソナを提供
- **RAG統合**: 各専門分野に対応したRAGシステムの段階的統合
- **スケーラビリティ**: 新しいカウンセラーペルソナの追加が容易な設計
- **ユーザーフレンドリー**: 直感的なUIで複数のカウンセラーにアクセス可能

### 1.3 提供するAIカウンセラー

| # | カウンセラー名 | 専門分野 | RAG対応 | 備考 |
|---|---|---|---|---|
| 1 | ミシェル | テープ式心理学 | ✓ 完成済み | 既存実装を流用 |
| 2 | 〇〇 | 臨床心理学 | ◐ 後から挿入 | YouTube文字起こし対応 |
| 3 | 〇〇 | 産業心理学 | ◐ 後から挿入 | YouTube文字起こし対応 |
| 4 | 〇〇 | 精神保健福祉士 | ◐ 後から挿入 | YouTube文字起こし対応 |
| 5 | 〇〇 | スクールカウンセラー | ◐ 後から挿入 | YouTube文字起こし対応 |
| 6 | 〇〇 | スピリチュアルカウンセラー | ◐ 後から挿入 | YouTube文字起こし対応 |
| 7 | GPT Assistant | 通常のGPTカウンセラー | ✗ 不要 | OpenAI API使用 |
| 8 | Gemini Assistant | 通常のGeminiカウンセラー | ✗ 不要 | Google API使用 |
| 9 | Claude Assistant | 通常のClaudeカウンセラー | ✗ 不要 | Anthropic API使用 |
| 10 | Deepseek Assistant | 通常のDeepseekカウンセラー | ✗ 不要 | Deepseek API使用 |

---

## 2. 要件定義

### 2.1 機能要件

#### 2.1.1 ユーザーインターフェース

- **カウンセラー選択画面**: 8〜10種類のカウンセラーペルソナから選択可能
- **チャットインターフェース**: 各カウンセラーとの対話画面
- **会話履歴管理**: ユーザーごとの会話履歴の保存と表示
- **プロフィール表示**: 各カウンセラーの専門分野、経歴、アプローチ方法の表示
- **レスポンシブデザイン**: PC、タブレット、スマートフォン対応

#### 2.1.2 AIカウンセラー機能

- **マルチモデル対応**: OpenAI、Google Gemini、Anthropic Claude、Deepseekなど複数のLLMをサポート
- **RAG統合**: 各専門分野のナレッジベースを活用した回答生成
- **システムプロンプト管理**: 各カウンセラーの個性と専門知識を反映したプロンプト設定
- **コンテキスト保持**: 会話の流れを理解した継続的なカウンセリング
- **レート制限対応**: API呼び出しのレート制限への対応

#### 2.1.3 データ管理

- **ユーザー認証**: 会話履歴の個人管理（オプション：ログイン機能）
- **会話データ保存**: Supabaseへの会話履歴の永続化
- **RAGデータベース**: 各専門分野のナレッジベース管理
- **チャンク管理**: 親子チャンク構造のデータベース設計

#### 2.1.4 管理機能

- **カウンセラー管理**: 新しいカウンセラーペルソナの追加・編集・削除
- **RAGデータ管理**: ナレッジベースの更新・管理
- **分析ダッシュボード**: 利用統計、人気カウンセラー、よくある質問の分析
- **システム設定**: APIキー管理、レート制限設定

### 2.2 非機能要件

| 要件 | 仕様 |
|---|---|
| **パフォーマンス** | API応答時間: 3秒以内、ページロード時間: 2秒以内 |
| **可用性** | 99.5%以上のアップタイム |
| **セキュリティ** | HTTPS通信、APIキーの安全管理、ユーザーデータの暗号化 |
| **スケーラビリティ** | 同時ユーザー数: 1,000以上対応可能 |
| **保守性** | モジュール化された設計、明確なドキュメント |
| **拡張性** | 新しいカウンセラーペルソナの追加が容易 |

---

## 3. システムアーキテクチャ

### 3.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                     フロントエンド (Vercel)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + TailwindCSS                    │  │
│  │  - カウンセラー選択画面                               │  │
│  │  - チャットUI                                        │  │
│  │  - 会話履歴表示                                      │  │
│  │  - プロフィール表示                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  バックエンド API (Vercel Functions)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes / Node.js                        │  │
│  │  - ユーザー認証                                      │  │
│  │  - メッセージ処理                                    │  │
│  │  - LLM API呼び出し                                   │  │
│  │  - RAG検索・統合                                     │  │
│  │  - 会話履歴管理                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┬───────────────────┐
        ↓                   ↓                   ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Supabase       │ │  LLM APIs        │ │  RAG Database    │
│  (PostgreSQL)    │ │                  │ │  (Vector Store)  │
│  - ユーザー      │ │ - OpenAI         │ │  - 親子チャンク  │
│  - 会話履歴      │ │ - Google Gemini  │ │  - メタデータ    │
│  - カウンセラー  │ │ - Anthropic      │ │  - ベクトル      │
│    設定          │ │ - Deepseek       │ │    埋め込み      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 3.2 技術スタック

| レイヤー | 技術 | 用途 |
|---|---|---|
| **フロントエンド** | React 18 + TypeScript | UI構築 |
| **スタイリング** | TailwindCSS | レスポンシブデザイン |
| **フレームワーク** | Next.js 14+ | フルスタック開発 |
| **バックエンド** | Node.js + Express/Next.js API | API実装 |
| **データベース** | Supabase (PostgreSQL) | ユーザー・会話データ |
| **ベクトルDB** | Supabase pgvector / Pinecone | RAG実装 |
| **LLM統合** | LangChain / OpenAI SDK | LLM呼び出し |
| **認証** | Supabase Auth | ユーザー管理 |
| **デプロイ** | Vercel | ホスティング |
| **環境管理** | .env.local | APIキー管理 |

### 3.3 データフロー

```
ユーザー入力
    ↓
[フロントエンド]
  - ユーザーメッセージ入力
  - カウンセラー選択
    ↓
[API Route]
  - リクエスト検証
  - ユーザー認証
    ↓
[RAG処理]
  - ユーザーメッセージのベクトル化
  - 関連ドキュメント検索
  - 親子チャンク取得
    ↓
[LLM処理]
  - システムプロンプト構築
  - RAGコンテキスト統合
  - LLM API呼び出し
    ↓
[データ保存]
  - 会話履歴をSupabaseに保存
    ↓
[レスポンス返却]
  - ストリーミングまたは完全応答
    ↓
[フロントエンド表示]
  - AIカウンセラーの回答表示
```

---

## 4. データベース設計

### 4.1 Supabaseスキーマ

#### 4.1.1 ユーザーテーブル

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 4.1.2 カウンセラーテーブル

```sql
CREATE TABLE counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  system_prompt TEXT NOT NULL,
  model_type VARCHAR(50) NOT NULL, -- 'openai', 'gemini', 'claude', 'deepseek'
  model_name VARCHAR(100) NOT NULL,
  rag_enabled BOOLEAN DEFAULT FALSE,
  rag_source_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.3 会話テーブル

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE
);
```

#### 4.1.4 メッセージテーブル

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.5 RAGドキュメントテーブル

```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'youtube', 'manual', 'file'
  source_id VARCHAR(255),
  title VARCHAR(255),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.6 RAGチャンクテーブル（親子構造）

```sql
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  parent_chunk_id UUID REFERENCES rag_chunks(id),
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rag_chunks_embedding ON rag_chunks USING ivfflat (embedding vector_cosine_ops);
```

#### 4.1.7 RAG検索ログテーブル

```sql
CREATE TABLE rag_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  query TEXT,
  retrieved_chunks JSONB,
  relevance_scores JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 ベクトル埋め込み戦略

- **埋め込みモデル**: OpenAI `text-embedding-3-small` または `text-embedding-3-large`
- **次元数**: 1536 (OpenAI標準)
- **更新頻度**: RAGドキュメント追加時に自動生成
- **インデックス**: IVFFLAT インデックスで高速検索

### 4.3 親子チャンク構造

```
Document (YouTube文字起こし)
├── Parent Chunk 1 (セクション全体)
│   ├── Child Chunk 1.1 (段落1)
│   ├── Child Chunk 1.2 (段落2)
│   └── Child Chunk 1.3 (段落3)
├── Parent Chunk 2 (セクション全体)
│   ├── Child Chunk 2.1 (段落1)
│   └── Child Chunk 2.2 (段落2)
└── Parent Chunk 3 (セクション全体)
    └── Child Chunk 3.1 (段落1)
```

**利点**:
- 細粒度検索（Child Chunkで関連部分を特定）
- 文脈保持（Parent Chunkで全体像を把握）
- 効率的なRAG実装

---

## 5. RAG統合設計

### 5.1 RAG処理フロー

```
ユーザーメッセージ
    ↓
[1. ベクトル化]
  OpenAI Embedding API
    ↓
[2. 類似度検索]
  Supabase pgvector
  - Child Chunkで関連部分検索
  - Top-K (例: 5件)
    ↓
[3. 親チャンク取得]
  関連Child Chunkの親を取得
  - 文脈情報の補足
    ↓
[4. コンテキスト構築]
  - メタデータ抽出
  - 関連度スコア付与
  - プロンプトに統合
    ↓
[5. LLM呼び出し]
  システムプロンプト + RAGコンテキスト + ユーザーメッセージ
    ↓
[6. レスポンス生成]
  AIカウンセラーの回答
```

### 5.2 RAGデータ挿入フロー

```
YouTube文字起こしテキスト
    ↓
[1. ドキュメント作成]
  rag_documents テーブルに挿入
    ↓
[2. セクション分割]
  テキストを論理的なセクションに分割
    ↓
[3. 親チャンク作成]
  各セクションを親チャンクとして作成
    ↓
[4. 子チャンク作成]
  各親チャンクを段落単位で分割
  ↓
[5. ベクトル化]
  各チャンクをOpenAI Embedding APIで埋め込み
    ↓
[6. Supabaseに保存]
  rag_chunks テーブルに保存
```

### 5.3 段階的RAG統合計画

| フェーズ | 対象カウンセラー | 実装方法 | タイムライン |
|---|---|---|---|
| **Phase 1** | ミシェル（テープ式心理学） | 既存実装を流用 | 初期リリース |
| **Phase 2** | 臨床心理学、産業心理学 | YouTube文字起こし挿入 | リリース後1-2週間 |
| **Phase 3** | 精神保健福祉士、スクールカウンセラー | YouTube文字起こし挿入 | リリース後2-3週間 |
| **Phase 4** | スピリチュアルカウンセラー | YouTube文字起こし挿入 | リリース後3-4週間 |
| **Phase 5** | 通常のLLMカウンセラー | RAG不要（LLMのみ） | リリース後1週間 |

---

## 6. UI/UX設計

### 6.1 ページ構成

#### 6.1.1 ホームページ

- **ヘッダー**: サイトロゴ、ナビゲーションメニュー
- **ヒーロー**: プロジェクト概要、CTA（カウンセラーを選ぶ）
- **カウンセラー一覧**: グリッドレイアウト、各カウンセラーのカード表示
- **フッター**: 利用規約、プライバシーポリシー、お問い合わせ

#### 6.1.2 カウンセラー詳細ページ

- **プロフィール**: 名前、専門分野、アイコン、説明
- **アプローチ方法**: カウンセリング手法の説明
- **開始ボタン**: チャット開始へのCTA

#### 6.1.3 チャットページ

- **ヘッダー**: 選択されたカウンセラー情報、戻るボタン
- **チャットエリア**: メッセージ表示、スクロール可能
- **入力エリア**: テキスト入力フィールド、送信ボタン
- **サイドバー**: 会話履歴、新規会話作成

#### 6.1.4 管理ダッシュボード（管理者用）

- **カウンセラー管理**: 追加、編集、削除
- **RAGデータ管理**: ドキュメント管理、チャンク確認
- **分析**: 利用統計、人気カウンセラー
- **設定**: APIキー管理、システム設定

### 6.2 デザインシステム

| 要素 | 仕様 |
|---|---|
| **カラーパレット** | プライマリ: #2563eb、セカンダリ: #7c3aed、グレー: #64748b |
| **フォント** | Inter (英語), Noto Sans JP (日本語) |
| **ボタン** | TailwindCSS `btn` コンポーネント |
| **カード** | 影付き、ホバーエフェクト |
| **レスポンシブ** | Mobile-first: sm (640px), md (768px), lg (1024px), xl (1280px) |

### 6.3 ユーザーフロー

```
ホームページ
    ↓
カウンセラー選択
    ↓
カウンセラー詳細確認
    ↓
チャット開始
    ↓
メッセージ入力・送信
    ↓
AIカウンセラー回答表示
    ↓
会話継続 or 別のカウンセラーに変更
```

---

## 7. 実装計画

### 7.1 開発フェーズ

| フェーズ | 内容 | 期間 | 成果物 |
|---|---|---|---|
| **Phase 1: 基盤構築** | Vercel + Supabase セットアップ、DB設計、基本API | 1-2週間 | 開発環境、DB、API基盤 |
| **Phase 2: フロントエンド** | React UI、チャットコンポーネント、ホームページ | 2-3週間 | フロントエンド完成 |
| **Phase 3: LLM統合** | OpenAI、Gemini、Claude、Deepseek API統合 | 1-2週間 | マルチモデル対応 |
| **Phase 4: RAG実装** | ベクトル埋め込み、検索、親子チャンク実装 | 2-3週間 | RAG機能完成 |
| **Phase 5: テスト・最適化** | ユーザーテスト、パフォーマンス最適化 | 1-2週間 | 本番環境対応 |
| **Phase 6: リリース** | 本番デプロイ、モニタリング | 1週間 | 公開 |

### 7.2 開発環境セットアップ

```bash
# プロジェクト初期化
npx create-next-app@latest ai-counselor-site --typescript --tailwind

# 依存パッケージ
npm install supabase @supabase/supabase-js
npm install openai @anthropic-ai/sdk
npm install langchain
npm install axios
npm install zustand (状態管理)
npm install react-markdown (マークダウン表示)
```

### 7.3 ファイル構成

```
ai-counselor-site/
├── app/
│   ├── page.tsx (ホームページ)
│   ├── counselor/
│   │   ├── [id]/page.tsx (カウンセラー詳細)
│   │   └── chat/[id]/page.tsx (チャットページ)
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── counselors/page.tsx
│   │   └── rag/page.tsx
│   └── api/
│       ├── chat/route.ts
│       ├── counselors/route.ts
│       ├── rag/route.ts
│       └── messages/route.ts
├── components/
│   ├── ChatInterface.tsx
│   ├── CounselorCard.tsx
│   ├── MessageBubble.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── supabase.ts
│   ├── llm.ts (LLM API呼び出し)
│   ├── rag.ts (RAG処理)
│   └── utils.ts
├── types/
│   └── index.ts
├── .env.local (APIキー)
└── package.json
```

---

## 8. APIエンドポイント仕様

### 8.1 チャットAPI

```
POST /api/chat
リクエスト:
{
  "counselor_id": "uuid",
  "user_id": "uuid",
  "conversation_id": "uuid",
  "message": "ユーザーメッセージ",
  "use_rag": true
}

レスポンス:
{
  "id": "message_id",
  "role": "assistant",
  "content": "AIカウンセラーの回答",
  "tokens_used": 150,
  "rag_sources": [
    {
      "chunk_id": "uuid",
      "relevance_score": 0.95,
      "content": "関連チャンク内容"
    }
  ]
}
```

### 8.2 カウンセラー一覧API

```
GET /api/counselors

レスポンス:
{
  "counselors": [
    {
      "id": "uuid",
      "name": "ミシェル",
      "specialty": "テープ式心理学",
      "description": "...",
      "icon_url": "...",
      "rag_enabled": true
    }
  ]
}
```

### 8.3 会話履歴API

```
GET /api/conversations/:user_id

レスポンス:
{
  "conversations": [
    {
      "id": "uuid",
      "counselor_id": "uuid",
      "title": "会話タイトル",
      "created_at": "2026-01-03T...",
      "message_count": 5
    }
  ]
}
```

### 8.4 RAGドキュメント挿入API

```
POST /api/rag/documents
リクエスト:
{
  "counselor_id": "uuid",
  "source_type": "youtube",
  "source_id": "youtube_video_id",
  "title": "ドキュメントタイトル",
  "content": "文字起こしテキスト"
}

レスポンス:
{
  "document_id": "uuid",
  "chunks_created": 45,
  "embeddings_generated": 45
}
```

---

## 9. セキュリティ・運用

### 9.1 セキュリティ対策

- **APIキー管理**: 環境変数に保存、Vercel Secrets使用
- **ユーザー認証**: Supabase Auth（JWT）
- **データ暗号化**: HTTPS通信、データベース内の機密情報は暗号化
- **レート制限**: API呼び出しのレート制限実装
- **入力検証**: XSS対策、SQLインジェクション対策

### 9.2 運用・モニタリング

- **ログ記録**: Vercel Logs、Supabase Logs
- **エラーハンドリ**: Sentry統合
- **パフォーマンス監視**: Vercel Analytics
- **ユーザー分析**: Google Analytics 4

### 9.3 スケーリング戦略

- **データベース**: Supabaseの自動スケーリング
- **API**: Vercelの自動スケーリング
- **ベクトル検索**: pgvectorのインデックス最適化
- **キャッシング**: Redis（オプション）

---

## 10. 今後の拡張計画

### 10.1 Phase 2以降の機能

- **複数言語対応**: 英語、中国語など
- **音声入出力**: 音声でのカウンセリング
- **カウンセリング記録のエクスポート**: PDF、Word形式
- **カウンセラー間の連携**: 複数カウンセラーの意見を統合
- **ユーザーフィードバック機能**: 回答の評価・改善
- **プレミアム機能**: 有料オプション（詳細分析、優先サポートなど）

### 10.2 RAGの拡張

- **複数言語RAG**: 各言語の文字起こしに対応
- **マルチモーダルRAG**: 動画、画像、テキストの統合
- **リアルタイムRAG更新**: 新しいYouTube動画の自動取り込み

---

## 11. デプロイメント・本番環境

### 11.1 Vercelデプロイ

```bash
# GitHub連携でのデプロイ
git push origin main
# Vercelが自動でビルド・デプロイ
```

### 11.2 環境変数（.env.local）

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# LLM APIs
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEEPSEEK_API_KEY=sk-xxx

# その他
NEXT_PUBLIC_SITE_URL=https://ai-counselor.example.com
```

### 11.3 本番環境チェックリスト

- [ ] HTTPS設定確認
- [ ] APIキーの安全管理確認
- [ ] データベースバックアップ設定
- [ ] ログ記録・モニタリング設定
- [ ] エラーハンドリング確認
- [ ] パフォーマンステスト実施
- [ ] セキュリティテスト実施
- [ ] ユーザー受け入れテスト実施

---

## 12. 参考資料・リンク

- **既存実装**: https://namisapo.app/michelle
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **LangChain Documentation**: https://python.langchain.com/docs/

---

## 付録A: 用語集

| 用語 | 説明 |
|---|---|
| **RAG** | Retrieval-Augmented Generation（検索拡張生成）。外部ナレッジベースを活用してLLMの回答を改善 |
| **ベクトル埋め込み** | テキストを数値ベクトルに変換し、意味的な類似度を計算可能にする技術 |
| **親子チャンク** | 大きなテキストセクション（親）を細粒度の段落（子）に分割し、検索効率と文脈保持を両立させる構造 |
| **pgvector** | PostgreSQLの拡張機能で、ベクトル検索を実装 |
| **システムプロンプト** | LLMの動作を制御するための初期指示 |
| **レート制限** | API呼び出し数の制限 |

---

**文書作成日**: 2026年1月3日  
**バージョン**: 1.0  
**ステータス**: 確認待ち


---

# 補足資料: 詳細実装ガイド

## A. Claude Code開発ガイドライン

### A.1 推奨される開発フロー

Claude Codeを使用した開発では、以下のフローを推奨します：

1. **プロジェクト初期化**: Next.js + TypeScript + TailwindCSS
2. **ファイル構成の確立**: 上記ファイル構成に従う
3. **型定義の作成**: `types/index.ts`で全型を定義
4. **ユーティリティ関数**: 再利用可能な関数を`lib/`に集約
5. **コンポーネント開発**: 小さな単位から始める
6. **API実装**: バックエンド機能を実装
7. **統合テスト**: 全機能の動作確認

### A.2 型定義例（TypeScript）

```typescript
// types/index.ts

export interface Counselor {
  id: string;
  name: string;
  specialty: string;
  description: string;
  iconUrl: string;
  systemPrompt: string;
  modelType: 'openai' | 'gemini' | 'claude' | 'deepseek';
  modelName: string;
  ragEnabled: boolean;
  ragSourceId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  ragSources?: RagSource[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  counselorId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

export interface RagChunk {
  id: string;
  documentId: string;
  parentChunkId?: string;
  chunkText: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface RagSource {
  chunkId: string;
  relevanceScore: number;
  content: string;
}
```

### A.3 Supabase統合例

```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ユーザー認証
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// カウンセラー取得
export async function getCounselors() {
  const { data, error } = await supabase
    .from('counselors')
    .select('*');
  return { data, error };
}

// 会話作成
export async function createConversation(
  userId: string,
  counselorId: string,
  title: string
) {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, counselor_id: counselorId, title }])
    .select();
  return { data, error };
}

// メッセージ保存
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed?: number
) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        role,
        content,
        tokens_used: tokensUsed,
      },
    ])
    .select();
  return { data, error };
}
```

### A.4 LLM API統合例

```typescript
// lib/llm.ts

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string
) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages = [
    {
      role: 'user' as const,
      content: ragContext
        ? `${ragContext}\n\n${userMessage}`
        : userMessage,
    },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    system: systemPrompt,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return {
    content: response.choices[0].message.content,
    tokensUsed: response.usage?.total_tokens,
  };
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string
) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: ragContext
          ? `${ragContext}\n\n${userMessage}`
          : userMessage,
      },
    ],
  });

  return {
    content: response.content[0].type === 'text' ? response.content[0].text : '',
    tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
  };
}

// モデル別の呼び出し関数
export async function callLLM(
  modelType: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  ragContext?: string
) {
  switch (modelType) {
    case 'openai':
      return await callOpenAI(systemPrompt, userMessage, ragContext);
    case 'claude':
      return await callClaude(systemPrompt, userMessage, ragContext);
    // 他のモデルも同様に実装
    default:
      throw new Error(`Unknown model type: ${modelType}`);
  }
}
```

### A.5 RAG処理例

```typescript
// lib/rag.ts

import { supabase } from './supabase';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// テキストをベクトル化
export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// 関連チャンクを検索
export async function searchRAG(
  counselorId: string,
  query: string,
  topK: number = 5
) {
  // クエリをベクトル化
  const queryEmbedding = await embedText(query);

  // ベクトル検索
  const { data: chunks, error } = await supabase.rpc(
    'match_rag_chunks',
    {
      query_embedding: queryEmbedding,
      counselor_id: counselorId,
      match_count: topK,
    }
  );

  if (error) throw error;

  // 親チャンクを取得
  const chunkIds = chunks.map((c: any) => c.id);
  const { data: parentChunks } = await supabase
    .from('rag_chunks')
    .select('*')
    .in('id', chunks.map((c: any) => c.parent_chunk_id).filter(Boolean));

  return {
    childChunks: chunks,
    parentChunks,
  };
}

// RAGコンテキストを構築
export function buildRAGContext(chunks: any[]): string {
  return chunks
    .map((chunk, index) => `[ソース ${index + 1}]\n${chunk.chunk_text}`)
    .join('\n\n');
}

// ドキュメントを挿入
export async function insertRAGDocument(
  counselorId: string,
  sourceType: string,
  sourceId: string,
  title: string,
  content: string
) {
  // ドキュメント作成
  const { data: doc, error: docError } = await supabase
    .from('rag_documents')
    .insert([
      {
        counselor_id: counselorId,
        source_type: sourceType,
        source_id: sourceId,
        title,
        content,
      },
    ])
    .select()
    .single();

  if (docError) throw docError;

  // テキストをセクションに分割
  const sections = content.split('\n\n').filter((s) => s.trim());

  let chunkIndex = 0;
  for (const section of sections) {
    // 親チャンク作成
    const sectionEmbedding = await embedText(section);
    const { data: parentChunk, error: parentError } = await supabase
      .from('rag_chunks')
      .insert([
        {
          document_id: doc.id,
          chunk_text: section,
          chunk_index: chunkIndex,
          embedding: sectionEmbedding,
        },
      ])
      .select()
      .single();

    if (parentError) throw parentError;

    // 子チャンク作成
    const paragraphs = section.split('\n').filter((p) => p.trim());
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paragraphEmbedding = await embedText(paragraph);

      await supabase.from('rag_chunks').insert([
        {
          document_id: doc.id,
          parent_chunk_id: parentChunk.id,
          chunk_text: paragraph,
          chunk_index: i,
          embedding: paragraphEmbedding,
        },
      ]);
    }

    chunkIndex++;
  }

  return doc;
}
```

### A.6 API Route実装例

```typescript
// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callLLM } from '@/lib/llm';
import { searchRAG, buildRAGContext } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const {
      counselorId,
      conversationId,
      message,
      useRag,
    } = await request.json();

    // カウンセラー情報取得
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('*')
      .eq('id', counselorId)
      .single();

    if (counselorError) throw counselorError;

    // RAGコンテキスト構築
    let ragContext = '';
    let ragSources = [];

    if (useRag && counselor.rag_enabled) {
      const { childChunks, parentChunks } = await searchRAG(
        counselorId,
        message
      );
      ragContext = buildRAGContext(childChunks);
      ragSources = childChunks.map((chunk: any) => ({
        chunkId: chunk.id,
        relevanceScore: chunk.similarity,
        content: chunk.chunk_text,
      }));
    }

    // LLM呼び出し
    const { content, tokensUsed } = await callLLM(
      counselor.model_type,
      counselor.model_name,
      counselor.system_prompt,
      message,
      ragContext
    );

    // メッセージ保存
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content,
          tokens_used: tokensUsed,
        },
      ])
      .select();

    if (saveError) throw saveError;

    // RAG検索ログ保存
    if (ragSources.length > 0) {
      await supabase.from('rag_search_logs').insert([
        {
          message_id: savedMessage[1].id,
          query: message,
          retrieved_chunks: ragSources,
        },
      ]);
    }

    return NextResponse.json({
      id: savedMessage[1].id,
      role: 'assistant',
      content,
      tokensUsed,
      ragSources,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## B. Supabase設定ガイド

### B.1 pgvector拡張機能の有効化

```sql
-- Supabase SQL Editorで実行
CREATE EXTENSION IF NOT EXISTS vector;

-- pgvectorのバージョン確認
SELECT extversion FROM pg_extension WHERE extname = 'vector';
```

### B.2 RLS（Row Level Security）設定

```sql
-- ユーザーは自分の会話のみアクセス可能
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- メッセージも同様に設定
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);
```

### B.3 ベクトル検索用のRPC関数

```sql
-- ベクトル検索用のRPC関数
CREATE OR REPLACE FUNCTION match_rag_chunks(
  query_embedding vector,
  counselor_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  parent_chunk_id uuid,
  chunk_text text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.document_id,
    rc.parent_chunk_id,
    rc.chunk_text,
    1 - (rc.embedding <=> query_embedding) as similarity
  FROM rag_chunks rc
  JOIN rag_documents rd ON rc.document_id = rd.id
  WHERE rd.counselor_id = match_rag_chunks.counselor_id
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## C. Vercelデプロイメント詳細

### C.1 環境変数の設定

Vercel Dashboardで以下の環境変数を設定：

```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
OPENAI_API_KEY = sk-...
GOOGLE_API_KEY = xxx
ANTHROPIC_API_KEY = sk-ant-...
DEEPSEEK_API_KEY = sk-...
NEXT_PUBLIC_SITE_URL = https://ai-counselor.vercel.app
```

### C.2 GitHub連携

```bash
# GitHubリポジトリを作成
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/ai-counselor-site.git
git push -u origin main

# Vercelで自動デプロイ開始
```

### C.3 本番環境チェック

```bash
# ローカルでの本番環境シミュレーション
npm run build
npm run start

# パフォーマンス測定
npm run analyze
```

---

## D. テスト戦略

### D.1 ユニットテスト

```typescript
// __tests__/lib/rag.test.ts

import { embedText, buildRAGContext } from '@/lib/rag';

describe('RAG Functions', () => {
  it('should embed text correctly', async () => {
    const embedding = await embedText('テスト');
    expect(embedding).toHaveLength(1536);
  });

  it('should build RAG context from chunks', () => {
    const chunks = [
      { chunk_text: 'チャンク1' },
      { chunk_text: 'チャンク2' },
    ];
    const context = buildRAGContext(chunks);
    expect(context).toContain('チャンク1');
    expect(context).toContain('チャンク2');
  });
});
```

### D.2 統合テスト

```typescript
// __tests__/api/chat.test.ts

import { POST } from '@/app/api/chat/route';

describe('Chat API', () => {
  it('should return a valid response', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        counselorId: 'test-id',
        conversationId: 'conv-id',
        message: 'こんにちは',
        useRag: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();
  });
});
```

---

## E. トラブルシューティング

### E.1 よくある問題と解決策

| 問題 | 原因 | 解決策 |
|---|---|---|
| **ベクトル検索が遅い** | インデックスなし | IVFFLAT インデックスを作成 |
| **API呼び出しエラー** | APIキー無効 | 環境変数を確認、再設定 |
| **メモリ不足** | 大規模ドキュメント | チャンク分割サイズを調整 |
| **CORS エラー** | オリジン設定不正 | Supabase CORS設定を確認 |

### E.2 ログ確認方法

```bash
# Vercelログ確認
vercel logs

# Supabaseログ確認
# Supabase Dashboard > Logs

# ローカルデバッグ
npm run dev
# ブラウザコンソール、ターミナルで確認
```

---

**補足資料作成日**: 2026年1月3日


---

# 補足資料2: RAG統合運用ガイド

## F. RAG統合の詳細実装

### F.1 YouTube文字起こしの取り込みプロセス

#### F.1.1 自動取り込みワークフロー

```
YouTube動画URL入力
    ↓
[1. 動画情報取得]
  YouTube Data API
  - 動画タイトル
  - 説明文
  - 再生時間
    ↓
[2. 文字起こし取得]
  YouTube自動字幕 or 外部API
  - Google Speech-to-Text
  - AssemblyAI
  - Rev.com
    ↓
[3. テキスト前処理]
  - タイムスタンプ削除
  - 改行正規化
  - 重複削除
    ↓
[4. セクション分割]
  - 句読点で自動分割
  - または手動マーク
    ↓
[5. チャンク生成]
  - 親チャンク: セクション全体
  - 子チャンク: 段落単位
    ↓
[6. ベクトル化]
  - OpenAI Embedding API
    ↓
[7. Supabaseに保存]
  - rag_documents
  - rag_chunks
```

#### F.1.2 実装コード例

```typescript
// lib/youtube-rag.ts

import { supabase } from './supabase';
import { insertRAGDocument } from './rag';

// YouTube動画ID抽出
function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}

// YouTube字幕取得（外部APIの例）
async function getYouTubeTranscript(videoId: string): Promise<string> {
  // YouTube Transcript APIを使用
  const response = await fetch(
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=ja`
  );
  const xml = await response.text();
  
  // XMLをテキストに変換
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const texts = Array.from(doc.querySelectorAll('text')).map(
    (el) => el.textContent
  );
  
  return texts.join(' ');
}

// テキスト前処理
function preprocessText(text: string): string {
  // タイムスタンプ削除
  let cleaned = text.replace(/\[\d{1,2}:\d{2}:\d{2}\]/g, '');
  
  // 改行正規化
  cleaned = cleaned.replace(/\n+/g, '\n');
  
  // 重複削除
  const lines = cleaned.split('\n');
  const unique = Array.from(new Set(lines));
  
  return unique.join('\n');
}

// セクション分割
function splitIntoSections(text: string): string[] {
  // 句点で分割
  const sections = text.split('。').filter((s) => s.trim());
  return sections.map((s) => s.trim() + '。');
}

// YouTube RAG統合メイン関数
export async function integrateYouTubeRAG(
  counselorId: string,
  youtubeUrl: string,
  title: string
) {
  try {
    // 動画ID抽出
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) throw new Error('Invalid YouTube URL');

    // 字幕取得
    const transcript = await getYouTubeTranscript(videoId);
    if (!transcript) throw new Error('Could not retrieve transcript');

    // テキスト前処理
    const cleanedText = preprocessText(transcript);

    // セクション分割
    const sections = splitIntoSections(cleanedText);
    const fullContent = sections.join('\n\n');

    // RAGドキュメント挿入
    const result = await insertRAGDocument(
      counselorId,
      'youtube',
      videoId,
      title,
      fullContent
    );

    return {
      success: true,
      documentId: result.id,
      sectionsCreated: sections.length,
      message: `${title}のRAG統合が完了しました。`,
    };
  } catch (error) {
    console.error('YouTube RAG integration error:', error);
    throw error;
  }
}
```

### F.2 複数YouTube動画の一括処理

```typescript
// lib/batch-youtube-rag.ts

import { integrateYouTubeRAG } from './youtube-rag';

export interface YouTubeVideo {
  url: string;
  title: string;
}

export async function batchIntegrateYouTube(
  counselorId: string,
  videos: YouTubeVideo[]
) {
  const results = [];
  
  for (const video of videos) {
    try {
      const result = await integrateYouTubeRAG(
        counselorId,
        video.url,
        video.title
      );
      results.push({
        ...result,
        videoTitle: video.title,
        status: 'success',
      });
    } catch (error) {
      results.push({
        videoTitle: video.title,
        status: 'error',
        error: (error as Error).message,
      });
    }
    
    // APIレート制限対策
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

### F.3 RAGデータの品質管理

```typescript
// lib/rag-quality.ts

import { supabase } from './supabase';

// チャンク品質スコア計算
export function calculateChunkQuality(chunk: string): number {
  let score = 100;
  
  // 短すぎるチャンク
  if (chunk.length < 50) score -= 20;
  
  // 長すぎるチャンク
  if (chunk.length > 1000) score -= 10;
  
  // 意味のない文字列
  if (!/[ぁ-ん一-龥]/.test(chunk)) score -= 30;
  
  // 重複チェック
  if (chunk.match(/(.{3,})\1/)) score -= 15;
  
  return Math.max(0, score);
}

// 低品質チャンクの検出
export async function detectLowQualityChunks(
  counselorId: string,
  threshold: number = 50
) {
  const { data: chunks, error } = await supabase
    .from('rag_chunks')
    .select('*')
    .eq('counselor_id', counselorId);

  if (error) throw error;

  const lowQuality = chunks
    .map((chunk) => ({
      ...chunk,
      qualityScore: calculateChunkQuality(chunk.chunk_text),
    }))
    .filter((chunk) => chunk.qualityScore < threshold);

  return lowQuality;
}

// チャンク品質の改善提案
export async function suggestChunkImprovements(
  counselorId: string
) {
  const lowQualityChunks = await detectLowQualityChunks(counselorId);
  
  const suggestions = lowQualityChunks.map((chunk) => ({
    chunkId: chunk.id,
    issue: chunk.qualityScore < 30 ? 'critical' : 'warning',
    suggestion:
      chunk.chunk_text.length < 50
        ? 'チャンクが短すぎます。前後のテキストと統合してください。'
        : 'チャンク内に重複または無意味なテキストが含まれています。',
  }));

  return suggestions;
}
```

---

## G. 複数LLMモデルの管理

### G.1 モデル設定テーブル

```sql
CREATE TABLE llm_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- 'openai', 'gemini', 'claude', 'deepseek'
  model_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  description TEXT,
  max_tokens INTEGER DEFAULT 4096,
  temperature FLOAT DEFAULT 0.7,
  cost_per_1k_input DECIMAL(10, 6),
  cost_per_1k_output DECIMAL(10, 6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ
INSERT INTO llm_models (provider, model_name, display_name, max_tokens, cost_per_1k_input, cost_per_1k_output) VALUES
('openai', 'gpt-4-turbo', 'GPT-4 Turbo', 4096, 0.01, 0.03),
('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 4096, 0.0005, 0.0015),
('gemini', 'gemini-pro', 'Gemini Pro', 32000, 0.0005, 0.0015),
('claude', 'claude-3-sonnet', 'Claude 3 Sonnet', 4096, 0.003, 0.015),
('deepseek', 'deepseek-chat', 'Deepseek Chat', 4096, 0.0001, 0.0002);
```

### G.2 モデル切り替え機能

```typescript
// lib/model-manager.ts

import { supabase } from './supabase';

export async function getAvailableModels(provider?: string) {
  let query = supabase
    .from('llm_models')
    .select('*')
    .eq('is_active', true);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function switchCounselorModel(
  counselorId: string,
  newModelId: string
) {
  // 新しいモデル情報取得
  const { data: model, error: modelError } = await supabase
    .from('llm_models')
    .select('*')
    .eq('id', newModelId)
    .single();

  if (modelError) throw modelError;

  // カウンセラー更新
  const { data, error } = await supabase
    .from('counselors')
    .update({
      model_type: model.provider,
      model_name: model.model_name,
    })
    .eq('id', counselorId)
    .select()
    .single();

  return { data, error };
}

// コスト計算
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  costPer1kInput: number,
  costPer1kOutput: number
): number {
  const inputCost = (inputTokens / 1000) * costPer1kInput;
  const outputCost = (outputTokens / 1000) * costPer1kOutput;
  return inputCost + outputCost;
}
```

---

## H. 分析・ダッシュボード実装

### H.1 分析用テーブル

```sql
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL REFERENCES counselors(id),
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  average_response_time_ms INTEGER,
  unique_users INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);
CREATE INDEX idx_usage_analytics_counselor ON usage_analytics(counselor_id);
```

### H.2 分析データ集計

```typescript
// lib/analytics.ts

import { supabase } from './supabase';

export async function generateDailyAnalytics(date: string) {
  // 各カウンセラーの統計を計算
  const { data: counselors } = await supabase
    .from('counselors')
    .select('id');

  for (const counselor of counselors || []) {
    // 会話数
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('counselor_id', counselor.id)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    // メッセージ数とトークン
    const { data: messages } = await supabase
      .from('messages')
      .select('tokens_used')
      .in(
        'conversation_id',
        (
          await supabase
            .from('conversations')
            .select('id')
            .eq('counselor_id', counselor.id)
        ).data?.map((c) => c.id) || []
      )
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    const totalTokens = messages?.reduce(
      (sum, m) => sum + (m.tokens_used || 0),
      0
    ) || 0;

    // 分析データ保存
    await supabase.from('usage_analytics').insert([
      {
        counselor_id: counselor.id,
        date,
        total_conversations: conversationCount || 0,
        total_messages: messages?.length || 0,
        total_tokens_used: totalTokens,
      },
    ]);
  }
}

// 人気カウンセラーランキング
export async function getTopCounselors(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('usage_analytics')
    .select(
      `
      counselor_id,
      counselors(name, specialty),
      sum(total_conversations) as total_conversations,
      sum(total_messages) as total_messages
    `
    )
    .gte('date', startDate.toISOString().split('T')[0])
    .order('total_conversations', { ascending: false })
    .limit(10);

  return data;
}

// よくある質問の抽出
export async function getFrequentQuestions(
  counselorId: string,
  limit: number = 10
) {
  // 簡易的な実装: メッセージの長さが短いものを質問と判定
  const { data } = await supabase
    .from('messages')
    .select('content')
    .eq('role', 'user')
    .in(
      'conversation_id',
      (
        await supabase
          .from('conversations')
          .select('id')
          .eq('counselor_id', counselorId)
      ).data?.map((c) => c.id) || []
    )
    .lt('length(content)', 200)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data;
}
```

---

## I. セキュリティ・コンプライアンス

### I.1 ユーザーデータ保護

```typescript
// lib/security.ts

import crypto from 'crypto';

// 機密データの暗号化
export function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    iv
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// 機密データの復号化
export function decryptData(encryptedData: string, key: string): string {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 会話履歴の自動削除ポリシー
export async function deleteOldConversations(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from('conversations')
    .delete()
    .lt('updated_at', cutoffDate.toISOString());

  return error;
}
```

### I.2 APIレート制限

```typescript
// lib/rate-limit.ts

import { supabase } from './supabase';

export async function checkRateLimit(
  userId: string,
  limit: number = 100,
  windowSeconds: number = 3600
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString());

  return (count || 0) < limit;
}

// レート制限エラーレスポンス
export function rateLimitResponse() {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  );
}
```

---

## J. 運用・保守ガイド

### J.1 定期メンテナンスタスク

| タスク | 頻度 | 説明 |
|---|---|---|
| **ベクトルインデックス最適化** | 週1回 | pgvectorインデックスの最適化 |
| **古い会話削除** | 月1回 | 90日以上前の会話を削除 |
| **分析データ集計** | 日1回 | 日次分析データの生成 |
| **バックアップ** | 日1回 | Supabaseデータのバックアップ |
| **APIキー更新** | 四半期1回 | セキュリティ向上のため定期更新 |

### J.2 モニタリング・アラート設定

```typescript
// lib/monitoring.ts

import { supabase } from './supabase';

export async function setupMonitoring() {
  // エラーレート監視
  const { data: errors } = await supabase
    .from('error_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const errorRate = (errors?.length || 0) / 100; // 仮の計算

  if (errorRate > 0.05) {
    // アラート送信
    console.warn('High error rate detected:', errorRate);
  }

  // APIレスポンスタイム監視
  const { data: slowRequests } = await supabase
    .from('request_logs')
    .select('*')
    .gt('response_time_ms', 3000)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  if ((slowRequests?.length || 0) > 10) {
    console.warn('Slow requests detected:', slowRequests?.length);
  }
}
```

### J.3 トラブルシューティングガイド

**問題**: ベクトル検索が遅い
```sql
-- インデックス再構築
REINDEX INDEX idx_rag_chunks_embedding;

-- インデックス統計更新
ANALYZE rag_chunks;
```

**問題**: メモリ使用量が多い
```typescript
// チャンクサイズを削減
const CHUNK_SIZE = 256; // 512から削減
const OVERLAP = 32; // 64から削減
```

**問題**: APIレート制限エラー
```typescript
// バックオフ戦略の実装
async function callWithRetry(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

**RAG運用ガイド作成日**: 2026年1月3日


---

# 補足資料3: UI/UXデザイン実装ガイド

## K. ページ構成詳細設計

### K.1 ホームページ（/）

#### K.1.1 ページレイアウト

```
┌─────────────────────────────────────────┐
│            ナビゲーションバー              │
│  ロゴ | ホーム | 使い方 | お問い合わせ    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          ヒーロー セクション              │
│                                         │
│  テープ式心理学                          │
│  AIカウンセラーサイト                    │
│                                         │
│  複数の専門分野のカウンセラーが            │
│  あなたをサポートします                  │
│                                         │
│  [カウンセラーを選ぶ] ボタン              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      カウンセラー紹介 セクション          │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ミシェル│  │臨床心理│  │産業心理│      │
│  │テープ式│  │学者  │  │学者  │      │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │精神保健│  │スクール│  │スピリチュアル│ │
│  │福祉士  │  │カウンセ│  │カウンセラー│ │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │GPT   │  │Gemini│  │Claude│         │
│  │Assistant│ │Assistant│ │Assistant│ │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ┌─────┐                                │
│  │Deepseek│                             │
│  │Assistant│                            │
│  └─────┘                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       特徴 セクション                    │
│                                         │
│ ✓ 複数の専門分野                        │
│ ✓ 24時間利用可能                        │
│ ✓ プライバシー保護                      │
│ ✓ 高度なAI技術                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         FAQ セクション                   │
│                                         │
│ Q: 料金はかかりますか？                  │
│ A: ...                                  │
│                                         │
│ Q: 個人情報は保護されますか？            │
│ A: ...                                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           フッター                      │
│  利用規約 | プライバシー | お問い合わせ  │
│  © 2026 テープ式心理学 AIカウンセラー    │
└─────────────────────────────────────────┘
```

#### K.1.2 React コンポーネント実装

```typescript
// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { getCounselors } from '@/lib/supabase';
import CounselorCard from '@/components/CounselorCard';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import FAQSection from '@/components/FAQSection';

export default function HomePage() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounselors = async () => {
      const { data, error } = await getCounselors();
      if (!error) {
        setCounselors(data);
      }
      setLoading(false);
    };
    fetchCounselors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ナビゲーション */}
      <nav className="sticky top-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                テープ式心理学 AIカウンセラー
              </h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                ホーム
              </a>
              <a href="#features" className="text-gray-700 hover:text-blue-600">
                特徴
              </a>
              <a href="#faq" className="text-gray-700 hover:text-blue-600">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <HeroSection />

      {/* カウンセラー一覧 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            カウンセラーを選ぶ
          </h2>
          {loading ? (
            <div className="text-center">読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {counselors.map((counselor) => (
                <CounselorCard key={counselor.id} counselor={counselor} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 特徴 */}
      <FeaturesSection />

      {/* FAQ */}
      <FAQSection />

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p>&copy; 2026 テープ式心理学 AIカウンセラー</p>
            <div className="space-x-6">
              <a href="#" className="hover:text-blue-400">
                利用規約
              </a>
              <a href="#" className="hover:text-blue-400">
                プライバシー
              </a>
              <a href="#" className="hover:text-blue-400">
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### K.2 カウンセラー詳細ページ（/counselor/[id]）

```typescript
// app/counselor/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Counselor } from '@/types';

export default function CounselorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCounselor = async () => {
      const { data, error } = await supabase
        .from('counselors')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error) {
        setCounselor(data);
      }
      setLoading(false);
    };

    fetchCounselor();
  }, [params.id]);

  if (loading) return <div>読み込み中...</div>;
  if (!counselor) return <div>カウンセラーが見つかりません</div>;

  const handleStartChat = async () => {
    // 新しい会話を作成
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      // ログインが必要な場合はここで処理
      router.push('/login');
      return;
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: user.user.id,
          counselor_id: params.id,
          title: `${counselor.name}との相談`,
        },
      ])
      .select()
      .single();

    if (!error && conversation) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="mb-8 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← 戻る
        </button>

        {/* カウンセラー情報 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-8">
            {/* アイコン */}
            <div className="flex-shrink-0">
              <img
                src={counselor.icon_url}
                alt={counselor.name}
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>

            {/* 情報 */}
            <div className="flex-grow">
              <h1 className="text-4xl font-bold mb-2">{counselor.name}</h1>
              <p className="text-xl text-gray-600 mb-4">
                {counselor.specialty}
              </p>
              <p className="text-gray-700 mb-6">{counselor.description}</p>

              {/* 開始ボタン */}
              <button
                onClick={handleStartChat}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg"
              >
                カウンセリングを開始
              </button>
            </div>
          </div>

          {/* アプローチ方法 */}
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-4">カウンセリング方法</h2>
            <div className="prose prose-lg">
              {/* ここにカウンセラーのアプローチ方法を表示 */}
              <p>{counselor.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### K.3 チャットページ（/chat/[id]）

```typescript
// app/chat/[id]/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message, Conversation } from '@/types';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';

export default function ChatPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      // 会話情報取得
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', params.id)
        .single();

      setConversation(conv);

      // メッセージ取得
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', params.id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    };

    fetchConversation();

    // リアルタイム更新
    const subscription = supabase
      .channel(`conversation:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${params.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [params.id]);

  // メッセージ送信時にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="flex h-screen bg-white">
      {/* サイドバー */}
      <Sidebar conversationId={params.id} />

      {/* チャット */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold">
            {conversation?.title || 'チャット'}
          </h1>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <ChatInterface conversationId={params.id} />
      </div>
    </div>
  );
}
```

### K.4 チャットコンポーネント

```typescript
// components/ChatInterface.tsx

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatInterfaceProps {
  conversationId: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      // ユーザーメッセージ保存
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
        },
      ]);

      // API呼び出し
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message,
          useRag: true,
        }),
      });

      const data = await response.json();

      // AIメッセージ保存
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: data.content,
          tokens_used: data.tokensUsed,
        },
      ]);

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="メッセージを入力..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={sending}
        />
        <button
          onClick={handleSendMessage}
          disabled={sending || !message.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg"
        >
          {sending ? '送信中...' : '送信'}
        </button>
      </div>
    </div>
  );
}
```

### K.5 カウンセラーカード

```typescript
// components/CounselorCard.tsx

'use client';

import { useRouter } from 'next/navigation';
import { Counselor } from '@/types';

interface CounselorCardProps {
  counselor: Counselor;
}

export default function CounselorCard({ counselor }: CounselorCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/counselor/${counselor.id}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* アイコン */}
      <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <img
          src={counselor.icon_url}
          alt={counselor.name}
          className="w-32 h-32 rounded-full object-cover"
        />
      </div>

      {/* 情報 */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{counselor.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{counselor.specialty}</p>
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {counselor.description}
        </p>

        {/* RAGバッジ */}
        {counselor.rag_enabled && (
          <div className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
            RAG対応
          </div>
        )}

        {/* ボタン */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          詳細を見る
        </button>
      </div>
    </div>
  );
}
```

---

## L. レスポンシブデザイン

### L.1 ブレークポイント設定

```typescript
// tailwind.config.ts

export default {
  theme: {
    screens: {
      'sm': '640px',   // スマートフォン
      'md': '768px',   // タブレット
      'lg': '1024px',  // 小型PC
      'xl': '1280px',  // 標準PC
      '2xl': '1536px', // 大型PC
    },
  },
};
```

### L.2 モバイル最適化

```typescript
// components/ResponsiveLayout.tsx

export default function ResponsiveLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* モバイル: 1列 */}
      {/* タブレット: 2列 */}
      {/* PC: 3列 */}
    </div>
  );
}
```

---

## M. アクセシビリティ対応

### M.1 WCAG 2.1 準拠

```typescript
// components/AccessibleButton.tsx

interface AccessibleButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function AccessibleButton({
  label,
  onClick,
  disabled,
  ariaLabel,
}: AccessibleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      className="focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
    >
      {label}
    </button>
  );
}
```

### M.2 カラーコントラスト

| 要素 | 背景色 | テキスト色 | コントラスト比 |
|---|---|---|---|
| ボタン | #2563eb | #ffffff | 8.6:1 ✓ |
| リンク | #ffffff | #2563eb | 8.6:1 ✓ |
| 本文 | #ffffff | #1f2937 | 12.6:1 ✓ |

---

**UI/UXデザインガイド作成日**: 2026年1月3日
