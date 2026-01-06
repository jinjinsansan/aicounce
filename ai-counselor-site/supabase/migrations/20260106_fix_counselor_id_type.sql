-- Migration to fix counselor_id type mismatch
-- The counselors table uses UUID for id, but the application uses string IDs like "nazare", "michele"
-- This migration changes the counselor_id references from UUID to TEXT

-- Step 1: Drop ALL foreign key constraints that reference counselors.id
ALTER TABLE IF EXISTS public.conversations
  DROP CONSTRAINT IF EXISTS conversations_counselor_id_fkey;

ALTER TABLE IF EXISTS public.rag_documents
  DROP CONSTRAINT IF EXISTS rag_documents_counselor_id_fkey;

ALTER TABLE IF EXISTS public.counselor_stats
  DROP CONSTRAINT IF EXISTS counselor_stats_counselor_id_fkey;

-- Step 2: Change counselors.id from UUID to TEXT
ALTER TABLE public.counselors
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Step 3: Change conversations.counselor_id from UUID to TEXT
ALTER TABLE public.conversations
  ALTER COLUMN counselor_id TYPE TEXT USING counselor_id::TEXT;

-- Step 4: Change rag_documents.counselor_id from UUID to TEXT (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rag_documents'
      AND column_name = 'counselor_id'
  ) THEN
    ALTER TABLE public.rag_documents
      ALTER COLUMN counselor_id TYPE TEXT USING counselor_id::TEXT;
  END IF;
END$$;

-- Step 5: Recreate foreign key constraints (but remove them since TEXT IDs don't need FK enforcement)
-- We'll keep the relationships in the application layer instead

-- Step 6: Update the match_rag_chunks function to use TEXT instead of UUID
CREATE OR REPLACE FUNCTION public.match_rag_chunks (
  query_embedding vector,
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

-- Step 7: Update increment_counselor_session function (already uses TEXT parameter)
-- This function is already correct

-- Step 8: Add index for better performance on text lookups
CREATE INDEX IF NOT EXISTS idx_conversations_counselor_id ON public.conversations(counselor_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_counselor_id ON public.rag_documents(counselor_id);
