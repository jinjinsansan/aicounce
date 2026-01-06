-- Supabase SQL Editorで実行して、シッダールタのRAGデータを確認

-- 1. rag_documentsにsiddharthaのドキュメントがあるか確認
SELECT 
  counselor_id,
  COUNT(*) as document_count,
  STRING_AGG(DISTINCT source_type, ', ') as source_types
FROM rag_documents
WHERE counselor_id = 'siddhartha'
GROUP BY counselor_id;

-- 2. rag_chunksにsiddharthaのチャンクがあるか確認（親子の内訳も）
SELECT 
  CASE 
    WHEN rc.parent_chunk_id IS NULL THEN 'parent'
    ELSE 'child'
  END as chunk_type,
  COUNT(*) as count
FROM rag_chunks rc
JOIN rag_documents rd ON rc.document_id = rd.id
WHERE rd.counselor_id = 'siddhartha'
GROUP BY chunk_type
ORDER BY chunk_type;

-- 3. サンプルチャンクの内容を確認
SELECT 
  rc.chunk_text,
  LENGTH(rc.chunk_text) as text_length,
  CASE 
    WHEN rc.parent_chunk_id IS NULL THEN 'parent'
    ELSE 'child'
  END as chunk_type
FROM rag_chunks rc
JOIN rag_documents rd ON rc.document_id = rd.id
WHERE rd.counselor_id = 'siddhartha'
LIMIT 3;

-- 4. match_rag_chunks関数のテスト（ダミーのembeddingで）
-- 注意: このクエリは実際のembeddingがないとエラーになる可能性があります
SELECT 
  id,
  LEFT(chunk_text, 100) as preview,
  similarity
FROM match_rag_chunks(
  (SELECT embedding FROM rag_chunks LIMIT 1),  -- ダミーembedding
  'siddhartha',
  3
);
