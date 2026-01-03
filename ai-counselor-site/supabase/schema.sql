-- Supabase schema for テープ式心理学 AIカウンセラー
-- このDDLをSupabase SQLエディタやCLIで実行して、Phase 1.3の要件を満たします。

-- Extensions -----------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

set search_path = public;

-- Users ----------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  username varchar(100),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  is_active boolean default true
);

-- Counselors -----------------------------------------------------------------
create table if not exists public.counselors (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  specialty varchar(100) not null,
  description text,
  icon_url varchar(500),
  system_prompt text not null,
  model_type varchar(50) not null,
  model_name varchar(100) not null,
  rag_enabled boolean default false,
  rag_source_id varchar(255),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

-- Conversations --------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  counselor_id uuid not null references public.counselors(id),
  title varchar(255),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  is_archived boolean default false
);

-- Messages -------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role varchar(20) not null check (role in ('user','assistant')),
  content text not null,
  tokens_used integer,
  created_at timestamptz default timezone('utc', now())
);

-- RAG Documents --------------------------------------------------------------
create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.counselors(id) on delete cascade,
  source_type varchar(50) not null,
  source_id varchar(255),
  title varchar(255),
  content text,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

-- RAG Chunks (parent/child structure) ---------------------------------------
create table if not exists public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  parent_chunk_id uuid references public.rag_chunks(id),
  chunk_text text not null,
  chunk_index integer,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_rag_chunks_document
  on public.rag_chunks (document_id);

create index if not exists idx_rag_chunks_parent
  on public.rag_chunks (parent_chunk_id);

create index if not exists idx_rag_chunks_embedding
  on public.rag_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RAG Search Logs -----------------------------------------------------------
create table if not exists public.rag_search_logs (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  query text,
  retrieved_chunks jsonb,
  relevance_scores jsonb,
  created_at timestamptz default timezone('utc', now())
);

-- LLM Models -----------------------------------------------------------------
create table if not exists public.llm_models (
  id uuid primary key default gen_random_uuid(),
  provider varchar(50) not null,
  model_name varchar(100) not null,
  display_name varchar(100),
  description text,
  max_tokens integer default 4096,
  temperature numeric(4,3),
  cost_per_1k_input numeric(10,6),
  cost_per_1k_output numeric(10,6),
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now())
);

-- Helper Function -----------------------------------------------------------
create or replace function public.match_rag_chunks (
  query_embedding vector,
  counselor_id uuid,
  match_count integer default 5
)
returns table (
  id uuid,
  document_id uuid,
  parent_chunk_id uuid,
  chunk_text text,
  similarity float
) language plpgsql as $$
begin
  return query
    select
      rc.id,
      rc.document_id,
      rc.parent_chunk_id,
      rc.chunk_text,
      1 - (rc.embedding <=> query_embedding) as similarity
    from public.rag_chunks rc
      join public.rag_documents rd on rc.document_id = rd.id
    where rd.counselor_id = match_rag_chunks.counselor_id
    order by rc.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Row Level Security (optional but recommended) ----------------------------
alter table if exists public.conversations enable row level security;
alter table if exists public.messages enable row level security;

drop policy if exists "Users can view their own conversations" on public.conversations;
create policy "Users can view their own conversations"
  on public.conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert conversations" on public.conversations;
create policy "Users can insert conversations"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert messages" on public.messages;
create policy "Users can insert messages"
  on public.messages
  for insert
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- End of schema ------------------------------------------------------------
