# 精神保健福祉RAGナレッジベース - 開発ドキュメント

## 📋 プロジェクト概要

**プロジェクト名**: なみサポ 精神保健福祉AIカウンセラー RAGシステム  
**バージョン**: 1.0.0  
**作成日**: 2026-01-07  
**対象ユーザー**: 心の悩みを抱える一般相談者

### 目的
精神保健福祉士講座の内容を基に、AIカウンセラーが相談者に寄り添った応答を生成するためのRAG（Retrieval-Augmented Generation）ナレッジベースを構築する。

---

## 📁 ディレクトリ構造

```
mhsw_rag_system/
├── chunks/
│   ├── parent/          # 親チャンク（26ファイル）
│   │   ├── mhsw_001_parent.md
│   │   ├── mhsw_002_parent.md
│   │   └── ...
│   └── child/           # 子チャンク（52ファイル）
│       ├── mhsw_001a_child.md
│       ├── mhsw_001b_child.md
│       └── ...
├── docs/
│   ├── CHUNK_INDEX.md   # チャンク一覧・インデックス
│   ├── SYSTEM_PROMPT.md # AIカウンセラー用システムプロンプト
│   └── README.md        # この開発ドキュメント
└── README.md            # プロジェクトルートREADME
```

---

## 🔧 チャンク仕様

### SINR（Sentence-level Index with Nested Retrieval）方式

```
┌─────────────────────────────────────┐
│          親チャンク（Parent）          │
│  ・包括的な説明（600-800トークン）      │
│  ・複数の視点からのアドバイス          │
├─────────────────────────────────────┤
│  子チャンクA │  子チャンクB            │
│  核心メッセージ1  │  核心メッセージ2    │
│  (80-100トークン) │ (80-100トークン)    │
└─────────────────────────────────────┘
```

### YAMLフロントマター仕様

```yaml
---
id: mhsw_XXX_parent          # 一意のID
type: parent                  # parent または child
parent_id: mhsw_XXX_parent   # 子チャンクのみ：親チャンクID
source: 精神保健福祉士講座    # ソース名
lecture: "講座タイトル"       # 講座名
theme: ["テーマ1", "テーマ2"] # 検索用テーマタグ
situation: ["状況1", "状況2"] # 想定される相談状況
token_estimate: 750           # 推定トークン数
---
```

### フィールド説明

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | ✅ | チャンクの一意識別子 |
| type | string | ✅ | `parent` または `child` |
| parent_id | string | 子のみ | 親チャンクのID |
| source | string | ✅ | コンテンツのソース |
| lecture | string | ✅ | 講座名 |
| theme | array | ✅ | 検索用テーマタグ（3-5個推奨） |
| situation | array | ✅ | 想定される相談状況（2-4個推奨） |
| token_estimate | number | ✅ | 推定トークン数 |

---

## 🔍 RAG実装ガイド

### 推奨アーキテクチャ

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ユーザー    │───▶│  RAG検索     │───▶│  LLM生成     │
│   入力        │    │  エンジン    │    │  （Claude）   │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  ベクトルDB   │
                    │  (チャンク)   │
                    └──────────────┘
```

### Supabase + pgvector 実装例

#### 1. テーブル作成

```sql
-- チャンクテーブル
CREATE TABLE mhsw_chunks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('parent', 'child')),
    parent_id TEXT REFERENCES mhsw_chunks(id),
    content TEXT NOT NULL,
    theme TEXT[] NOT NULL,
    situation TEXT[] NOT NULL,
    token_estimate INTEGER,
    embedding vector(1536),  -- OpenAI ada-002 or Claude
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ベクトル検索用インデックス
CREATE INDEX ON mhsw_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- テーマ検索用インデックス
CREATE INDEX ON mhsw_chunks USING GIN (theme);
CREATE INDEX ON mhsw_chunks USING GIN (situation);
```

#### 2. 検索関数

```sql
-- ベクトル類似度検索
CREATE OR REPLACE FUNCTION search_chunks(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id TEXT,
    content TEXT,
    theme TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        c.theme,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM mhsw_chunks c
    WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

#### 3. Python実装例

```python
from supabase import create_client
import openai

# Supabase接続
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_embedding(text: str) -> list:
    """テキストをベクトル化"""
    response = openai.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def search_relevant_chunks(query: str, top_k: int = 5) -> list:
    """関連チャンクを検索"""
    query_embedding = get_embedding(query)
    
    result = supabase.rpc(
        'search_chunks',
        {
            'query_embedding': query_embedding,
            'match_threshold': 0.7,
            'match_count': top_k
        }
    ).execute()
    
    return result.data

def get_parent_chunk(child_id: str) -> dict:
    """子チャンクから親チャンクを取得"""
    result = supabase.table('mhsw_chunks')\
        .select('*')\
        .eq('id', child_id.replace('a_child', '_parent').replace('b_child', '_parent'))\
        .single()\
        .execute()
    
    return result.data
```

### Claude API 統合例

```python
import anthropic

client = anthropic.Anthropic()

def generate_counselor_response(
    user_message: str,
    relevant_chunks: list,
    conversation_history: list
) -> str:
    """AIカウンセラーの応答を生成"""
    
    # RAGコンテキストを構築
    rag_context = "\n\n".join([
        f"【参考情報 {i+1}】\n{chunk['content']}"
        for i, chunk in enumerate(relevant_chunks)
    ])
    
    # システムプロンプト（SYSTEM_PROMPT.mdの内容）
    system_prompt = """
    あなたは「なみサポ」の精神保健福祉AIカウンセラーです。
    心の悩みを抱える方々に寄り添い、精神保健福祉の専門知識に基づいた
    支援的な対話を提供します。
    
    以下の参考情報を活用して、相談者に寄り添った応答を生成してください。
    情報をそのまま読み上げるのではなく、相談者の状況に合わせて
    温かく伝えてください。
    
    {rag_context}
    """.format(rag_context=rag_context)
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        temperature=0.4,
        system=system_prompt,
        messages=conversation_history + [
            {"role": "user", "content": user_message}
        ]
    )
    
    return response.content[0].text
```

---

## 📊 チャンクデータのインポート

### Markdownファイルからのパース

```python
import yaml
import os
from pathlib import Path

def parse_chunk_file(filepath: str) -> dict:
    """チャンクファイルをパース"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # YAMLフロントマターを抽出
    if content.startswith('---'):
        _, frontmatter, body = content.split('---', 2)
        metadata = yaml.safe_load(frontmatter)
        content_body = body.strip()
    else:
        metadata = {}
        content_body = content
    
    return {
        **metadata,
        'content': content_body
    }

def import_all_chunks(chunks_dir: str) -> list:
    """全チャンクをインポート"""
    chunks = []
    
    for subdir in ['parent', 'child']:
        dir_path = Path(chunks_dir) / subdir
        for filepath in dir_path.glob('*.md'):
            chunk = parse_chunk_file(str(filepath))
            chunks.append(chunk)
    
    return chunks
```

### バッチインポートスクリプト

```python
def batch_import_to_supabase(chunks: list):
    """チャンクをSupabaseに一括インポート"""
    for chunk in chunks:
        # Embedding生成
        embedding = get_embedding(chunk['content'])
        
        # Supabaseに挿入
        supabase.table('mhsw_chunks').insert({
            'id': chunk['id'],
            'type': chunk['type'],
            'parent_id': chunk.get('parent_id'),
            'content': chunk['content'],
            'theme': chunk['theme'],
            'situation': chunk['situation'],
            'token_estimate': chunk['token_estimate'],
            'embedding': embedding
        }).execute()
        
        print(f"Imported: {chunk['id']}")
```

---

## ⚠️ 危機対応の実装

### キーワードモニタリング

```python
CRISIS_KEYWORDS = [
    "死にたい", "消えたい", "いなくなりたい",
    "生きていても仕方ない", "迷惑をかけている",
    "楽になりたい", "もう終わりにしたい",
    "自殺", "自傷", "リストカット"
]

def check_crisis_keywords(message: str) -> bool:
    """危機的キーワードをチェック"""
    return any(keyword in message for keyword in CRISIS_KEYWORDS)

def get_crisis_response() -> str:
    """危機対応メッセージを返す"""
    return """
今、とても辛い状況にいらっしゃるのですね。
話してくださってありがとうございます。

今すぐ話を聴いてもらえる場所があります：

【いのちの電話】0570-783-556
【よりそいホットライン】0120-279-338（24時間）
【こころの健康相談統一ダイヤル】0570-064-556

一人で抱え込まないでください。
あなたの話を聴きたいと思っている人がいます。
"""
```

---

## 🧪 テスト

### テストケース例

```python
test_queries = [
    {
        "query": "親がお酒を飲んで暴れます",
        "expected_chunks": ["mhsw_011", "mhsw_013"],
        "expected_themes": ["依存症家庭", "子ども"]
    },
    {
        "query": "自分のせいだと思ってしまいます",
        "expected_chunks": ["mhsw_011", "mhsw_017"],
        "expected_themes": ["自責感", "あなたのせいではない"]
    },
    {
        "query": "やめたいのにやめられません",
        "expected_chunks": ["mhsw_022", "mhsw_023"],
        "expected_themes": ["依存症", "自己治療"]
    }
]
```

---

## 📝 今後の拡張予定

### コンテンツ追加
- [ ] うつ病・不安障害に関するチャンク
- [ ] 発達障害に関するチャンク
- [ ] 高齢者のメンタルヘルス
- [ ] 若者向けコンテンツ

### 機能追加
- [ ] 多言語対応
- [ ] 音声入力対応
- [ ] フォローアップ機能
- [ ] 相談履歴の要約

---

## 📞 サポート

質問や問題がある場合は、開発チームにお問い合わせください。

---

## ライセンス

本ナレッジベースのコンテンツは、精神保健福祉の啓発目的で作成されています。
商用利用の際は適切な許諾を取得してください。
