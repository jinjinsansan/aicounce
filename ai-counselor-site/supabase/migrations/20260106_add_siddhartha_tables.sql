-- Create siddhartha_sessions table
CREATE TABLE IF NOT EXISTS public.siddhartha_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  auth_user_id text NOT NULL,
  title text,
  category text DEFAULT 'general'::text NOT NULL,
  openai_thread_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create siddhartha_messages table
CREATE TABLE IF NOT EXISTS public.siddhartha_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  session_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT siddhartha_messages_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.siddhartha_sessions(id) 
    ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS siddhartha_sessions_auth_user_id_idx 
  ON public.siddhartha_sessions(auth_user_id);

CREATE INDEX IF NOT EXISTS siddhartha_sessions_updated_at_idx 
  ON public.siddhartha_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS siddhartha_messages_session_id_idx 
  ON public.siddhartha_messages(session_id);

CREATE INDEX IF NOT EXISTS siddhartha_messages_created_at_idx 
  ON public.siddhartha_messages(created_at);

-- Enable RLS
ALTER TABLE public.siddhartha_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siddhartha_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for siddhartha_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.siddhartha_sessions
  FOR SELECT
  USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can create their own sessions"
  ON public.siddhartha_sessions
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can update their own sessions"
  ON public.siddhartha_sessions
  FOR UPDATE
  USING (auth_user_id = auth.uid()::text)
  WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own sessions"
  ON public.siddhartha_sessions
  FOR DELETE
  USING (auth_user_id = auth.uid()::text);

-- RLS Policies for siddhartha_messages
CREATE POLICY "Users can view messages in their own sessions"
  ON public.siddhartha_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.siddhartha_sessions
      WHERE siddhartha_sessions.id = siddhartha_messages.session_id
        AND siddhartha_sessions.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in their own sessions"
  ON public.siddhartha_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.siddhartha_sessions
      WHERE siddhartha_sessions.id = siddhartha_messages.session_id
        AND siddhartha_sessions.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their own sessions"
  ON public.siddhartha_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.siddhartha_sessions
      WHERE siddhartha_sessions.id = siddhartha_messages.session_id
        AND siddhartha_sessions.auth_user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.siddhartha_sessions
      WHERE siddhartha_sessions.id = siddhartha_messages.session_id
        AND siddhartha_sessions.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages in their own sessions"
  ON public.siddhartha_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.siddhartha_sessions
      WHERE siddhartha_sessions.id = siddhartha_messages.session_id
        AND siddhartha_sessions.auth_user_id = auth.uid()::text
    )
  );

-- RAG Search Functions for Siddhartha
-- Note: Assumes rag_documents table structure with counselor_id, content, embedding, metadata

-- Function 1: Basic RAG search (original approach)
CREATE OR REPLACE FUNCTION public.match_siddhartha_knowledge(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  similarity_threshold double precision DEFAULT 0.65
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    rd.id,
    rd.content,
    rd.metadata,
    1 - (rd.embedding <=> query_embedding) as similarity
  FROM public.rag_documents rd
  WHERE rd.counselor_id = 'siddhartha'
    AND rd.embedding IS NOT NULL
    AND rd.parent_id IS NULL
    AND 1 - (rd.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY rd.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function 2: SINR approach (parent-child chunks)
CREATE OR REPLACE FUNCTION public.match_siddhartha_knowledge_sinr(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  similarity_threshold double precision DEFAULT 0.65
)
RETURNS TABLE (
  parent_id uuid,
  parent_content text,
  parent_metadata jsonb,
  parent_source text,
  child_similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (p.id)
    p.id as parent_id,
    p.content as parent_content,
    p.metadata as parent_metadata,
    p.source_id as parent_source,
    1 - (c.embedding <=> query_embedding) as child_similarity
  FROM public.rag_documents c
  JOIN public.rag_documents p ON c.parent_id = p.id
  WHERE p.counselor_id = 'siddhartha'
    AND c.counselor_id = 'siddhartha'
    AND c.embedding IS NOT NULL
    AND c.parent_id IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY p.id, c.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;
