# 仏様AIカウンセラー - Claude Code開発プロンプト

## プロジェクト概要

仏教の経典と教えに基づいたAIカウンセラー「仏様」を開発します。RAG（Retrieval-Augmented Generation）システムを使用し、相談者の悩みに最適な仏教の智慧を提供します。

## システム構成

```
buddha-counselor/
├── app/
│   ├── main.py              # FastAPIアプリケーション
│   ├── counselor.py         # カウンセラーロジック
│   ├── rag/
│   │   ├── embeddings.py    # 埋め込みベクトル生成
│   │   ├── retriever.py     # チャンク検索
│   │   └── reranker.py      # 関連度再ランキング
│   └── prompts/
│       └── system_prompt.py # システムプロンプト
├── data/
│   ├── chunks/
│   │   ├── parent/          # 親チャンク（100個）
│   │   └── child/           # 子チャンク（215個）
│   └── embeddings/          # 生成された埋め込み
├── tests/
├── requirements.txt
└── README.md
```

## 技術スタック

- **LLM**: Claude API (claude-3-sonnet or claude-3-opus)
- **Embedding**: OpenAI text-embedding-3-small または multilingual-e5-large
- **Vector Store**: Pinecone / Weaviate / Qdrant / ChromaDB
- **Backend**: FastAPI
- **Frontend**: Next.js / React (オプション)

## 実装手順

### Step 1: 環境セットアップ

```bash
# プロジェクト作成
mkdir buddha-counselor && cd buddha-counselor
python -m venv venv
source venv/bin/activate

# 依存関係インストール
pip install anthropic openai pinecone-client fastapi uvicorn pydantic python-frontmatter
```

### Step 2: チャンクのパース

```python
# app/rag/chunk_parser.py
import frontmatter
from pathlib import Path
from typing import List, Dict

def parse_chunks(directory: Path) -> List[Dict]:
    """Markdownチャンクをパースしてメタデータと本文を抽出"""
    chunks = []
    for file_path in directory.glob("*.md"):
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
            chunk = {
                "id": post.metadata.get("id"),
                "type": post.metadata.get("type"),
                "parent_id": post.metadata.get("parent_id"),
                "scripture": post.metadata.get("scripture"),
                "theme": post.metadata.get("theme", []),
                "situation": post.metadata.get("situation", []),
                "token_estimate": post.metadata.get("token_estimate"),
                "content": post.content,
                "file_path": str(file_path)
            }
            chunks.append(chunk)
    return chunks
```

### Step 3: 埋め込みベクトル生成

```python
# app/rag/embeddings.py
from openai import OpenAI
from typing import List, Dict
import json

client = OpenAI()

def create_embedding_text(chunk: Dict) -> str:
    """検索用のテキストを生成"""
    parts = []
    
    # テーマとシチュエーションを含める（検索精度向上）
    if chunk.get("theme"):
        parts.append(f"テーマ: {', '.join(chunk['theme'])}")
    if chunk.get("situation"):
        parts.append(f"状況: {', '.join(chunk['situation'])}")
    if chunk.get("scripture"):
        parts.append(f"経典: {chunk['scripture']}")
    
    parts.append(chunk["content"])
    
    return "\n".join(parts)

def generate_embeddings(chunks: List[Dict]) -> List[Dict]:
    """全チャンクの埋め込みを生成"""
    embedded_chunks = []
    
    for chunk in chunks:
        text = create_embedding_text(chunk)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        chunk["embedding"] = response.data[0].embedding
        embedded_chunks.append(chunk)
    
    return embedded_chunks
```

### Step 4: ベクトルストア設定（Pinecone例）

```python
# app/rag/vector_store.py
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict

def init_pinecone():
    """Pineconeの初期化"""
    pc = Pinecone(api_key="YOUR_API_KEY")
    
    # インデックス作成（初回のみ）
    if "buddha-counselor" not in pc.list_indexes().names():
        pc.create_index(
            name="buddha-counselor",
            dimension=1536,  # text-embedding-3-small
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    
    return pc.Index("buddha-counselor")

def upsert_chunks(index, chunks: List[Dict]):
    """チャンクをベクトルストアに保存"""
    vectors = []
    for chunk in chunks:
        vectors.append({
            "id": chunk["id"],
            "values": chunk["embedding"],
            "metadata": {
                "type": chunk["type"],
                "parent_id": chunk.get("parent_id"),
                "scripture": chunk.get("scripture"),
                "theme": chunk.get("theme", []),
                "situation": chunk.get("situation", []),
                "content": chunk["content"][:1000]  # メタデータサイズ制限
            }
        })
    
    # バッチ処理
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i+batch_size]
        index.upsert(vectors=batch)
```

### Step 5: 検索システム

```python
# app/rag/retriever.py
from openai import OpenAI
from typing import List, Dict

client = OpenAI()

def retrieve_relevant_chunks(
    index,
    query: str,
    top_k: int = 5,
    include_parent: bool = True
) -> List[Dict]:
    """クエリに関連するチャンクを検索"""
    
    # クエリの埋め込み生成
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_embedding = response.data[0].embedding
    
    # ベクトル検索
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    chunks = []
    parent_ids = set()
    
    for match in results["matches"]:
        chunk = {
            "id": match["id"],
            "score": match["score"],
            **match["metadata"]
        }
        chunks.append(chunk)
        
        # 親チャンクのIDを収集
        if chunk.get("parent_id"):
            parent_ids.add(chunk["parent_id"])
    
    # 親チャンクも取得（階層的コンテキスト）
    if include_parent and parent_ids:
        parent_results = index.fetch(ids=list(parent_ids))
        for parent_id, parent_data in parent_results["vectors"].items():
            parent_chunk = {
                "id": parent_id,
                "score": 0.9,  # 親は高スコア
                "is_parent": True,
                **parent_data["metadata"]
            }
            chunks.insert(0, parent_chunk)  # 親を先頭に
    
    return chunks
```

### Step 6: カウンセラーロジック

```python
# app/counselor.py
from anthropic import Anthropic
from typing import List, Dict
from .rag.retriever import retrieve_relevant_chunks

client = Anthropic()

SYSTEM_PROMPT = """
[system_prompt.mdの内容をここに挿入]
"""

def format_context(chunks: List[Dict]) -> str:
    """検索結果をコンテキストとしてフォーマット"""
    context_parts = []
    
    for chunk in chunks:
        prefix = "【参考経典】" if chunk.get("is_parent") else "【実践ガイド】"
        context_parts.append(f"{prefix}\n{chunk['content']}\n")
    
    return "\n---\n".join(context_parts)

def counsel(user_message: str, conversation_history: List[Dict] = None) -> str:
    """相談に対する回答を生成"""
    
    # 関連チャンクを検索
    chunks = retrieve_relevant_chunks(
        index=get_index(),  # ベクトルストアのインデックス
        query=user_message,
        top_k=5
    )
    
    # コンテキストを構築
    context = format_context(chunks)
    
    # システムプロンプトにコンテキストを追加
    enhanced_system = f"{SYSTEM_PROMPT}\n\n## 参考となる仏教の教え\n\n{context}"
    
    # 会話履歴を構築
    messages = conversation_history or []
    messages.append({"role": "user", "content": user_message})
    
    # Claude APIを呼び出し
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1024,
        system=enhanced_system,
        messages=messages
    )
    
    return response.content[0].text
```

### Step 7: APIエンドポイント

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from .counselor import counsel

app = FastAPI(title="仏様AIカウンセラー")

class Message(BaseModel):
    role: str
    content: str

class CounselRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = None

class CounselResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

@app.post("/counsel", response_model=CounselResponse)
async def counsel_endpoint(request: CounselRequest):
    try:
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        response = counsel(request.message, history)
        return CounselResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "buddha-counselor"}
```

## 検索最適化のヒント

### 1. ハイブリッド検索
```python
def hybrid_search(query: str, chunks: List[Dict]) -> List[Dict]:
    """セマンティック検索とキーワード検索を組み合わせ"""
    # セマンティック検索
    semantic_results = vector_search(query)
    
    # キーワード検索（situationタグ）
    keyword_results = keyword_match(query, chunks, field="situation")
    
    # スコアを統合
    combined = merge_results(semantic_results, keyword_results, alpha=0.7)
    return combined
```

### 2. クエリ拡張
```python
def expand_query(query: str) -> str:
    """LLMを使ってクエリを拡張"""
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""以下の相談内容から、関連する仏教のキーワードを抽出してください：

相談: {query}

キーワード（カンマ区切り）:"""
        }]
    )
    keywords = response.content[0].text
    return f"{query} {keywords}"
```

### 3. リランキング
```python
def rerank_chunks(query: str, chunks: List[Dict]) -> List[Dict]:
    """LLMを使って関連度を再評価"""
    for chunk in chunks:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": f"""相談内容と仏教の教えの関連度を1-10で評価してください。

相談: {query}
教え: {chunk['content'][:500]}

スコア（数字のみ）:"""
            }]
        )
        chunk["rerank_score"] = int(response.content[0].text.strip())
    
    return sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)
```

## デプロイメント

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 環境変数
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
```

## テスト

```python
# tests/test_counselor.py
import pytest
from app.counselor import counsel

def test_basic_counsel():
    response = counsel("最近、仕事のストレスで辛いです")
    assert response is not None
    assert len(response) > 0

def test_buddhist_reference():
    response = counsel("執着を手放すにはどうしたらいいですか")
    assert "執着" in response or "手放" in response or "空" in response
```

## 運用のヒント

1. **ログ記録**: 相談内容と応答をログに記録（プライバシーに配慮）
2. **フィードバック**: ユーザーからのフィードバックを収集して改善
3. **A/Bテスト**: 異なるプロンプトやモデルを比較テスト
4. **モニタリング**: 応答時間、エラー率を監視
5. **定期更新**: チャンクの追加・修正を定期的に実施

---

*このプロンプトは、仏教AIカウンセラーの開発ガイドとして作成されました。*
*実際の実装では、セキュリティ、エラーハンドリング、スケーラビリティを考慮してください。*
