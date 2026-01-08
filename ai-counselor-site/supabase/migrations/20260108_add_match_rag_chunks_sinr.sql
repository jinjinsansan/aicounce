-- SINR (Search is not Retrieval) for generic counselor RAG
-- Search with child chunks (small) and return parent chunks (large) for LLM context.

DROP FUNCTION IF EXISTS public.match_rag_chunks_sinr(vector, text, integer, double precision);
DROP FUNCTION IF EXISTS public.match_rag_chunks_sinr(vector(1536), text, integer, double precision);

CREATE FUNCTION public.match_rag_chunks_sinr(
  query_embedding vector(1536),
  counselor_id text,
  match_count integer default 5,
  similarity_threshold double precision default 0.65
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  parent_chunk_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  select distinct on (p.id)
    p.id,
    p.document_id,
    p.parent_chunk_id,
    p.chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.rag_chunks c
  join public.rag_chunks p on c.parent_chunk_id = p.id
  join public.rag_documents rd on c.document_id = rd.id
  where rd.counselor_id = match_rag_chunks_sinr.counselor_id
    and c.parent_chunk_id is not null
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by p.id, c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
