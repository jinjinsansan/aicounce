-- 1. match_rag_chunks関数が1つだけ存在することを確認
SELECT 
  routine_name,
  data_type as return_type,
  type_udt_name
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'match_rag_chunks';

-- 2. 関数のパラメータを確認
SELECT 
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE '%match_rag_chunks%'
ORDER BY ordinal_position;

-- 3. 実際に関数を呼び出してテスト
SELECT 
  id,
  LEFT(chunk_text, 100) as preview,
  similarity
FROM match_rag_chunks(
  (SELECT embedding FROM rag_chunks rc 
   JOIN rag_documents rd ON rc.document_id = rd.id 
   WHERE rd.counselor_id = 'siddhartha' 
   LIMIT 1),
  'siddhartha',
  5
);
