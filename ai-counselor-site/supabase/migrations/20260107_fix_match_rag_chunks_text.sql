-- Fix match_rag_chunks function to properly use TEXT for counselor_id
-- This ensures "siddhartha" (text) works instead of expecting UUID

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.match_rag_chunks(vector, text, integer);

-- Recreate with correct parameter name
CREATE FUNCTION public.match_rag_chunks (
  query_embedding vector(1536),
  counselor_id text,
  match_count integer default 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  parent_chunk_id uuid,
  chunk_text text,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT
      rc.id,
      rc.document_id,
      rc.parent_chunk_id,
      rc.chunk_text,
      1 - (rc.embedding <=> query_embedding) as similarity
    FROM public.rag_chunks rc
      JOIN public.rag_documents rd ON rc.document_id = rd.id
    WHERE rd.counselor_id = match_rag_chunks.counselor_id
    ORDER BY rc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Verify rag_documents.counselor_id is TEXT type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rag_documents'
      AND column_name = 'counselor_id'
      AND data_type = 'uuid'
  ) THEN
    -- Convert from UUID to TEXT if still UUID
    ALTER TABLE public.rag_documents
      ALTER COLUMN counselor_id TYPE TEXT USING counselor_id::TEXT;
    
    RAISE NOTICE 'Converted rag_documents.counselor_id from UUID to TEXT';
  END IF;
END$$;
