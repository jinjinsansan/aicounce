# 臨床心理学AIカウンセラー（Dr. Sato）開発計画書

## プロジェクト概要

### 目的
ミシェル（Michelle）の実装構造を完全に踏襲し、田所先生の臨床心理学講義16本を学習した臨床心理学AIカウンセラー「Dr. Sato（ドクター・サトウ）」を実装する。

### 参考実装
- **完全参考**: Michelle AI実装（/api/michelle/*, MichelleChatClient.tsx等）
- **RAG手法**: SINR（Small-to-big Information Retrieval）親子チャンク構造
- **知識ベース**: 親チャンク135個、子チャンク523個（講義16本分）

### システム構成
- **フロントエンド**: Next.js 16 + React
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase（PostgreSQL + pgvector）
- **LLM**: OpenAI GPT-4o-mini（Assistants API）
- **RAG**: OpenAI Embeddings + Supabaseベクトル検索

---

## Phase 1: データベース設計

### 1.1 テーブル設計

#### ✅ 新規テーブル作成（supabase/schema.sql）

**clinical_sessions テーブル**
```sql
create table if not exists public.clinical_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references public.users(id) on delete cascade,
  title text,
  openai_thread_id text,
  total_tokens integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index clinical_sessions_user_idx on public.clinical_sessions (auth_user_id);
```

**clinical_messages テーブル**
```sql
create type clinical_message_role as enum ('user', 'assistant', 'system');

create table if not exists public.clinical_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.clinical_sessions(id) on delete cascade,
  role clinical_message_role not null,
  content text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index clinical_messages_session_idx on public.clinical_messages (session_id);
```

**clinical_knowledge_parents テーブル**
```sql
create table if not exists public.clinical_knowledge_parents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null,
  parent_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index clinical_knowledge_parents_source_idx on public.clinical_knowledge_parents(source);
```

**clinical_knowledge_children テーブル**
```sql
create table if not exists public.clinical_knowledge_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.clinical_knowledge_parents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  child_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index clinical_knowledge_children_parent_idx on public.clinical_knowledge_children(parent_id);
create index clinical_knowledge_children_embedding_idx
  on public.clinical_knowledge_children using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

#### ✅ Row Level Security (RLS) 設定

```sql
alter table public.clinical_sessions enable row level security;
alter table public.clinical_messages enable row level security;
alter table public.clinical_knowledge_parents enable row level security;
alter table public.clinical_knowledge_children enable row level security;

-- Sessions policies
create policy clinical_sessions_select_own on public.clinical_sessions
  for select using (auth.uid() = auth_user_id);

create policy clinical_sessions_mutate_own on public.clinical_sessions
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- Messages policies
create policy clinical_messages_select on public.clinical_messages
  for select using (
    exists (
      select 1 from public.clinical_sessions cs
      where cs.id = clinical_messages.session_id
        and cs.auth_user_id = auth.uid()
    )
  );

create policy clinical_messages_insert on public.clinical_messages
  for insert with check (
    exists (
      select 1 from public.clinical_sessions cs
      where cs.id = clinical_messages.session_id
        and cs.auth_user_id = auth.uid()
    )
  );

-- Knowledge policies (service role only)
create policy clinical_knowledge_parents_service_role on public.clinical_knowledge_parents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy clinical_knowledge_children_service_role on public.clinical_knowledge_children
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
```

#### ✅ RPC関数作成

```sql
-- SINR検索関数
create or replace function public.match_clinical_knowledge_sinr(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold double precision default 0.65
)
returns table (
  parent_id uuid,
  parent_content text,
  parent_metadata jsonb,
  parent_source text,
  child_similarity double precision
)
language sql
stable
as $$
  select distinct on (p.id)
    p.id as parent_id,
    p.content as parent_content,
    p.metadata as parent_metadata,
    p.source as parent_source,
    1 - (c.embedding <=> query_embedding) as child_similarity
  from public.clinical_knowledge_children c
  join public.clinical_knowledge_parents p on c.parent_id = p.id
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by p.id, c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
```

### 1.2 TypeScript型定義更新

**types/supabase.ts に追加**
```typescript
export interface ClinicalSession {
  id: string;
  auth_user_id: string;
  title: string | null;
  openai_thread_id: string | null;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicalMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicalKnowledgeParent {
  id: string;
  content: string;
  source: string;
  parent_index: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ClinicalKnowledgeChild {
  id: string;
  parent_id: string;
  content: string;
  embedding: number[] | null;
  child_index: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
```

---

## Phase 2: バックエンド実装

### 2.1 環境変数・設定

#### ✅ 環境変数追加（.env.example）

```bash
# Clinical Psychology AI Counselor
CLINICAL_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxx
```

#### ✅ 環境変数チェック更新（scripts/check-env.ts）

```typescript
const CLINICAL_VARS = [
  'CLINICAL_ASSISTANT_ID',
];

// 追加
if (missing.length > 0) {
  console.error('Clinical Psychology:', missing);
}
```

#### ✅ Feature Flag作成（lib/feature-flags.ts に追加）

```typescript
export const CLINICAL_AI_ENABLED = Boolean(
  process.env.CLINICAL_ASSISTANT_ID &&
  process.env.OPENAI_API_KEY
);
```

### 2.2 環境変数・OpenAIヘルパー作成

#### ✅ lib/clinical/env.server.ts

```typescript
export const clinicalEnv = {
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  assistantId: process.env.CLINICAL_ASSISTANT_ID ?? '',
};
```

#### ✅ lib/clinical/openai.ts

```typescript
import OpenAI from 'openai';
import { clinicalEnv } from './env.server';

let openaiInstance: OpenAI | null = null;

export function getClinicalOpenAIClient(): OpenAI {
  if (!openaiInstance && clinicalEnv.openAiApiKey) {
    openaiInstance = new OpenAI({ apiKey: clinicalEnv.openAiApiKey });
  }
  if (!openaiInstance) {
    throw new Error('OpenAI client not initialized');
  }
  return openaiInstance;
}

export function getClinicalAssistantId(): string {
  if (!clinicalEnv.assistantId) {
    throw new Error('CLINICAL_ASSISTANT_ID not set');
  }
  return clinicalEnv.assistantId;
}
```

### 2.3 RAGライブラリ作成

#### ✅ lib/clinical/rag.ts

```typescript
import { getClinicalOpenAIClient } from './openai';
import { getServiceSupabase } from '@/lib/supabase-server';

export interface ClinicalKnowledgeMatch {
  parent_id: string;
  parent_content: string;
  parent_metadata: Record<string, unknown> | null;
  parent_source: string;
  similarity: number;
}

export async function retrieveClinicalKnowledgeMatches(
  query: string,
  options: {
    matchCount?: number;
    similarityThreshold?: number;
  } = {}
): Promise<ClinicalKnowledgeMatch[]> {
  const { matchCount = 5, similarityThreshold = 0.65 } = options;

  try {
    // 1. Generate embedding
    const openai = getClinicalOpenAIClient();
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. SINR search
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.rpc('match_clinical_knowledge_sinr', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      similarity_threshold: similarityThreshold,
    });

    if (error) {
      console.error('[Clinical RAG] Supabase RPC error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[Clinical RAG] No matches found');
      return [];
    }

    return data.map((row: any) => ({
      parent_id: row.parent_id,
      parent_content: row.parent_content,
      parent_metadata: row.parent_metadata,
      parent_source: row.parent_source,
      similarity: row.child_similarity,
    }));
  } catch (error) {
    console.error('[Clinical RAG] Error:', error);
    return [];
  }
}
```

### 2.4 APIルート作成

#### ✅ app/api/clinical/chat/route.ts

**参考**: app/api/michelle/chat/route.ts を完全にコピーし、以下を置換：
- `michelle` → `clinical`
- `MICHELLE_AI_ENABLED` → `CLINICAL_AI_ENABLED`
- `michelleEnv` → `clinicalEnv`
- `getClinicalOpenAIClient`, `getClinicalAssistantId`
- `retrieveClinicalKnowledgeMatches`
- テーブル名：`clinical_sessions`, `clinical_messages`

**主要機能**:
- POST: ユーザーメッセージ受信
- RAG検索実行
- OpenAI Assistants API呼び出し
- ストリーミングレスポンス
- DB保存

#### ✅ app/api/clinical/sessions/route.ts

**参考**: app/api/michelle/sessions/route.ts

**機能**:
- GET: セッション一覧取得（最新50件）

#### ✅ app/api/clinical/sessions/[sessionId]/messages/route.ts

**参考**: app/api/michelle/sessions/[sessionId]/messages/route.ts

**機能**:
- GET: 特定セッションのメッセージ一覧取得

#### ✅ app/api/clinical/sessions/[sessionId]/route.ts

**参考**: app/api/michelle/sessions/[sessionId]/route.ts

**機能**:
- DELETE: セッション削除

### 2.5 プロキシ保護設定

#### ✅ proxy.ts に追加

```typescript
// Protected Clinical routes
if (pathname.startsWith('/api/clinical')) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## Phase 3: フロントエンド実装

### 3.1 チャットUIコンポーネント作成

#### ✅ components/ClinicalChatClient.tsx

**参考**: components/MichelleChatClient.tsx を完全にコピーし、以下を置換：
- `michelle` → `clinical`
- `Michelle` → `Clinical Psychology`
- カラースキーム：ピンク系 → ブルー系
- アイコン：michelle.png → dr_satou.png

**主要機能**:
- セッション一覧（サイドバー）
- メッセージ表示
- 入力フォーム
- ローディング状態
- エラーハンドリング
- モバイル対応

**カラー変更例**:
```typescript
// Michelle: pink-500, rose-400
// Clinical: blue-500, cyan-400

const colors = {
  primary: 'blue-500',
  secondary: 'cyan-400',
  light: 'blue-50',
  gradient: 'from-blue-500 to-cyan-500',
};
```

### 3.2 ルーティング統合

#### ✅ app/counselor/chat/[id]/page.tsx に条件分岐追加

```typescript
// Michelle専用ページ
if (counselorId === "michele") {
  return <MichelleChatClient />;
}

// Clinical Psychology専用ページ
if (counselorId === "sato") {
  return <ClinicalChatClient />;
}
```

---

## Phase 4: データ投入

### 4.1 データ準備

#### ✅ ai-counselor-site/data/ 配下にコピー

```bash
# ソース
/home/jinjinsansan/aicounce/clinical_psych_rag_hierarchical/

# 宛先
ai-counselor-site/data/clinical_psych_rag/
├── parents/
│   ├── lecture01/
│   ├── lecture02/
│   └── ... (lecture16まで)
├── children/
│   ├── lecture01/
│   ├── lecture02/
│   └── ... (lecture16まで)
└── mapping.json
```

### 4.2 アップロードスクリプト作成

#### ✅ scripts/clinical-knowledge/chunk-sinr.ts

**参考**: scripts/michelle-knowledge/chunk-sinr.ts

**機能**:
- Markdownファイル読み込み
- YAMLフロントマター解析
- 親子関係抽出

#### ✅ scripts/clinical-knowledge/upload-to-rag.ts

**参考**: scripts/michelle-knowledge/upload-to-rag.ts を完全にコピーし、以下を変更：
- テーブル名：`clinical_knowledge_parents`, `clinical_knowledge_children`
- データパス：`data/clinical_psych_rag/`
- ログプレフィックス：`[Clinical Upload]`

**主要機能**:
- 親チャンク135個をDBに挿入
- 子チャンク523個の埋め込み生成
- 子チャンクをDBに挿入
- progress表示

#### ✅ package.json にスクリプト追加

```json
{
  "scripts": {
    "clinical:upload": "ts-node scripts/clinical-knowledge/upload-to-rag.ts"
  }
}
```

### 4.3 アップロード実行

```bash
# 1. 環境変数確認
echo $SUPABASE_SERVICE_ROLE_KEY
echo $OPENAI_API_KEY

# 2. 既存データクリア（初回のみ）
npm run clinical:upload -- --clear

# 3. データ投入
npm run clinical:upload
```

**予想所要時間**: 15-20分（OpenAI Embeddings API呼び出し523回）

---

## Phase 5: OpenAI Assistants作成

### 5.1 OpenAI Platform設定

#### ✅ Assistant作成

1. https://platform.openai.com/assistants にアクセス
2. 「Create Assistant」クリック
3. 設定：
   - **Name**: Clinical Psychology Counselor
   - **Model**: gpt-4o-mini
   - **Instructions**: `/home/jinjinsansan/aicounce/clinical_psych_system_prompt.md` の内容を貼り付け
   - **Tools**: なし（RAGは外部実装）
   - **Temperature**: 0.7
4. 作成後、Assistant IDをコピー（`asst_xxxxxxxxxxxxxxxxxxxx`）

#### ✅ 環境変数設定

```bash
# .env.local
CLINICAL_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxx

# Vercel環境変数
# Settings > Environment Variables で同じく設定
```

---

## Phase 6: カウンセラーマスターデータ更新

### 6.1 FALLBACK_COUNSELORS更新

#### ✅ lib/constants/counselors.ts

**"sato" エントリを確認・更新**:

```typescript
{
  id: "sato",
  name: "ドクター・サトウ",
  specialty: "臨床心理学",
  description: "科学的根拠に基づき、論理的かつ信頼できるアドバイスを提供します。",
  iconUrl: "/images/counselors/dr_satou.png",
  modelType: "openai",
  modelName: "gpt-4o-mini",
  ragEnabled: true,
  tags: ["論理的", "科学的", "信頼"],
  responseTime: "即時",
  sessionCount: 860,
},
```

---

## Phase 7: テスト・検証

### 7.1 ローカルテスト

#### ✅ チェックリスト

- [ ] `npm run lint` パス
- [ ] `npm test` パス
- [ ] `npm run build` 成功
- [ ] ローカルサーバー起動（`npm run dev`）
- [ ] `/counselor/sato` ページ表示確認
- [ ] `/counselor/chat/sato` でチャット起動
- [ ] ログイン後、新規セッション作成
- [ ] メッセージ送信・受信
- [ ] RAGログ確認（コンソールに `[Clinical RAG]` 表示）
- [ ] セッション一覧表示
- [ ] セッション削除
- [ ] モバイル表示確認

### 7.2 統合テスト

#### ✅ APIテスト

```bash
# セッション一覧
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/clinical/sessions

# チャット送信
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"うつ病について教えてください"}' \
  http://localhost:3000/api/clinical/chat
```

#### ✅ RAG検証

```typescript
// lib/clinical/rag.ts でテスト
const matches = await retrieveClinicalKnowledgeMatches('認知の歪み', {
  matchCount: 3,
  similarityThreshold: 0.6,
});
console.log(matches);
// 期待: lecture16（認知行動療法）の親チャンクがヒット
```

---

## Phase 8: デプロイ

### 8.1 Supabaseスキーマ適用

#### ✅ 本番DB更新

1. Supabase Dashboard > SQL Editor
2. `supabase/schema.sql` のClinical部分を実行
3. テーブル作成確認
4. RLS有効化確認
5. RPC関数動作確認

### 8.2 データ投入（本番）

```bash
# 本番環境変数設定
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export OPENAI_API_KEY=...

# アップロード実行
npm run clinical:upload -- --clear
```

### 8.3 Vercel環境変数設定

```
CLINICAL_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxx
```

### 8.4 デプロイ

```bash
git add .
git commit -m "feat: add clinical psychology AI counselor (Dr. Sato)"
git push origin main
```

### 8.5 デプロイ後確認

- [ ] https://aicounce.vercel.app/counselor/sato 表示
- [ ] https://aicounce.vercel.app/counselor/chat/sato でチャット動作
- [ ] ログイン → セッション作成 → メッセージ送受信
- [ ] Sentry エラーログ確認
- [ ] Vercel ログ確認

---

## Phase 9: Dr. Sato専用詳細ページ作成（オプション）

### 9.1 専用詳細ページ

**参考**: components/MichelleDetailPage.tsx

#### ✅ components/ClinicalDetailPage.tsx

**特徴**:
- 田所先生の講義16本を学習
- 科学的根拠に基づくカウンセリング
- 認知行動療法、クライエント中心療法等
- ブルー/シアングラデーション

#### ✅ app/counselor/[id]/page.tsx に統合

```typescript
if (counselorId === "sato") {
  return <ClinicalDetailPage />;
}
```

---

## Phase 10: ドキュメント更新

### 10.1 README更新

#### ✅ プロジェクトREADME

- Clinical Psychology AI追加の記載
- 環境変数一覧更新
- セットアップ手順更新

### 10.2 引き継ぎメモ

#### ✅ CLINICAL_HANDOFF.md作成

- 実装詳細
- トラブルシューティング
- 今後の拡張方針

---

## トラブルシューティング

### よくある問題と解決策

#### 問題1: RAG検索で結果が0件

**原因**:
- embeddings未生成
- similarity_threshold が高すぎる

**解決**:
```sql
-- embedding確認
SELECT count(*) FROM clinical_knowledge_children WHERE embedding IS NOT NULL;

-- threshold下げてテスト
SELECT * FROM match_clinical_knowledge_sinr('[0.1, 0.2, ...]', 5, 0.5);
```

#### 問題2: OpenAI Assistants APIエラー

**原因**:
- Assistant ID間違い
- API Key無効
- Rate limit

**解決**:
```bash
# 環境変数確認
echo $CLINICAL_ASSISTANT_ID

# OpenAI Platform で Assistant 存在確認
```

#### 問題3: セッション作成できない

**原因**:
- RLS設定ミス
- auth.uid() が null

**解決**:
```sql
-- RLS policy確認
SELECT * FROM pg_policies WHERE tablename = 'clinical_sessions';

-- auth確認
SELECT auth.uid();
```

---

## 成功基準

### ✅ 完了チェックリスト

#### Phase 1-2: Backend
- [ ] Supabaseスキーマ適用済み
- [ ] RPC関数動作確認
- [ ] APIルート全て実装
- [ ] lint/test/build パス

#### Phase 3: Frontend
- [ ] ClinicalChatClient実装
- [ ] ルーティング統合
- [ ] モバイル対応

#### Phase 4: Data
- [ ] 親チャンク135個投入
- [ ] 子チャンク523個+embeddings投入
- [ ] RAG検索動作確認

#### Phase 5-6: Integration
- [ ] OpenAI Assistant作成
- [ ] 環境変数設定完了
- [ ] カウンセラーマスター更新

#### Phase 7-8: Testing & Deploy
- [ ] ローカル動作確認
- [ ] 本番デプロイ成功
- [ ] エンドツーエンド動作確認

#### Phase 9-10: Polish
- [ ] 詳細ページ作成（オプション）
- [ ] ドキュメント更新

---

## タイムライン目安

| Phase | 内容 | 所要時間 |
|-------|------|----------|
| 1 | データベース設計 | 30分 |
| 2 | バックエンド実装 | 1-2時間 |
| 3 | フロントエンド実装 | 1-2時間 |
| 4 | データ投入 | 30分（アップロード20分含む） |
| 5 | OpenAI Assistants | 15分 |
| 6 | マスター更新 | 10分 |
| 7 | テスト | 30分 |
| 8 | デプロイ | 30分 |
| 9 | 詳細ページ（オプション） | 1時間 |
| 10 | ドキュメント | 30分 |
| **合計** | | **6-8時間** |

---

## 次のステップ

この計画書をレビュー後、以下の順で進めます：

1. **Phase 1開始**: Supabaseスキーマ更新
2. **Phase 2開始**: バックエンドAPI実装
3. **Phase 3開始**: フロントエンドUI実装
4. **Phase 4開始**: データ投入
5. 以降、順次実行

---

**作成日**: 2026-01-05  
**作成者**: Droid AI Assistant  
**バージョン**: 1.0  
**参考実装**: Michelle AI (完全踏襲)
