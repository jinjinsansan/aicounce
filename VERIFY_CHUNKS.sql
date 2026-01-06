-- チャンクの親子構造を確認
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
