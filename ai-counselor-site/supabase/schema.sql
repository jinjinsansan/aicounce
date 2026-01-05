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
  last_login_at timestamptz,
  terms_accepted_at timestamptz,
  receive_announcements boolean not null default true,
  official_line_id text,
  line_linked_at timestamptz,
  paypal_payer_id text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  is_active boolean default true
);

-- Billing Plans ------------------------------------------------------------
create table if not exists public.billing_plans (
  id text primary key,
  name text not null,
  description text,
  tier text not null check (tier in ('basic','premium')),
  price_cents integer not null,
  currency char(3) not null default 'JPY',
  paypal_plan_id text,
  is_active boolean not null default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

insert into public.billing_plans (id, name, description, tier, price_cents, currency, paypal_plan_id)
values
  ('basic', 'ベーシックプラン', '個別カウンセリングが対象', 198000, 'JPY', null),
  ('premium', 'プレミアムプラン', '個別+チームカウンセリング', 398000, 'JPY', null)
on conflict (id) do nothing;

-- User Subscriptions -------------------------------------------------------
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  status text not null check (status in ('active','trialing','past_due','canceled')),
  paypal_subscription_id text,
  paypal_order_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_user_subscriptions_user
  on public.user_subscriptions (user_id);

-- Trials ------------------------------------------------------------------
create table if not exists public.user_trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  source text not null check (source in ('line')),
  line_linked boolean not null default false,
  trial_started_at timestamptz,
  trial_expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.campaign_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  duration_days integer not null check (duration_days > 0),
  usage_limit integer,
  usage_count integer not null default 0,
  valid_from timestamptz,
  valid_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.campaign_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_code_id uuid not null references public.campaign_codes(id) on delete cascade,
  redeemed_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique(user_id, campaign_code_id)
);

create index if not exists idx_campaign_redemptions_user on public.campaign_redemptions(user_id);
create index if not exists idx_campaign_redemptions_expires on public.campaign_redemptions(expires_at);

-- Notifications & Campaigns -----------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  channel text not null default 'inbox',
  sent_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create index if not exists idx_notifications_user
  on public.notifications (user_id, sent_at desc);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null,
  created_by uuid references public.users(id),
  sent_at timestamptz,
  target_count integer,
  delivered_count integer,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.newsletter_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  delivered_at timestamptz,
  status text not null default 'pending',
  metadata jsonb
);

create index if not exists idx_campaign_recipients_campaign
  on public.newsletter_campaign_recipients (campaign_id);

-- Admin Audit -------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.user_subscriptions enable row level security;
alter table public.user_trials enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_campaign_recipients enable row level security;
alter table public.campaign_codes enable row level security;
alter table public.campaign_redemptions enable row level security;

drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
create policy user_subscriptions_select_own
  on public.user_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists user_subscriptions_mutate_own on public.user_subscriptions;
create policy user_subscriptions_mutate_own
  on public.user_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_subscriptions_service_role on public.user_subscriptions;
create policy user_subscriptions_service_role
  on public.user_subscriptions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists user_trials_select_own on public.user_trials;
create policy user_trials_select_own
  on public.user_trials
  for select using (auth.uid() = user_id);

drop policy if exists user_trials_service_role on public.user_trials;
create policy user_trials_service_role
  on public.user_trials
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_service_role on public.notifications;
create policy notifications_service_role
  on public.notifications
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists newsletter_campaigns_service_role on public.newsletter_campaigns;
create policy newsletter_campaigns_service_role
  on public.newsletter_campaigns
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists newsletter_campaign_recipients_service_role on public.newsletter_campaign_recipients;
create policy newsletter_campaign_recipients_service_role
  on public.newsletter_campaign_recipients
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists campaign_codes_service_role on public.campaign_codes;
create policy campaign_codes_service_role
  on public.campaign_codes
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists campaign_redemptions_service_role on public.campaign_redemptions;
create policy campaign_redemptions_service_role
  on public.campaign_redemptions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Newsletter Subscribers ----------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  created_at timestamptz default timezone('utc', now()),
  confirmed_at timestamptz,
  metadata jsonb,
  source varchar(100)
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists newsletter_subscribers_service_role on public.newsletter_subscribers;
create policy newsletter_subscribers_service_role
  on public.newsletter_subscribers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

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

-- Michelle Psychology Chat (SINR対応) --------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'michelle_session_category') then
    create type michelle_session_category as enum ('love', 'life', 'relationship');
  end if;

  if not exists (select 1 from pg_type where typname = 'michelle_message_role') then
    create type michelle_message_role as enum ('user', 'assistant', 'system');
  end if;
end$$;

create table if not exists public.michelle_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references public.users(id) on delete cascade,
  category michelle_session_category not null default 'life',
  title text,
  openai_thread_id text,
  total_tokens integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.michelle_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.michelle_sessions(id) on delete cascade,
  role michelle_message_role not null,
  content text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.michelle_knowledge (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.michelle_knowledge_parents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null,
  parent_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.michelle_knowledge_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.michelle_knowledge_parents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  child_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists michelle_sessions_user_idx on public.michelle_sessions (auth_user_id);
create index if not exists michelle_messages_session_idx on public.michelle_messages (session_id);
create index if not exists michelle_knowledge_embedding_idx
  on public.michelle_knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists michelle_knowledge_parents_source_idx on public.michelle_knowledge_parents(source);
create index if not exists michelle_knowledge_children_parent_idx on public.michelle_knowledge_children(parent_id);
create index if not exists michelle_knowledge_children_embedding_idx
  on public.michelle_knowledge_children using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.michelle_sessions enable row level security;
alter table public.michelle_messages enable row level security;
alter table public.michelle_knowledge enable row level security;
alter table public.michelle_knowledge_parents enable row level security;
alter table public.michelle_knowledge_children enable row level security;

drop policy if exists michelle_sessions_select_own on public.michelle_sessions;
create policy michelle_sessions_select_own
  on public.michelle_sessions
  for select using (auth.uid() = auth_user_id);

drop policy if exists michelle_sessions_mutate_own on public.michelle_sessions;
create policy michelle_sessions_mutate_own
  on public.michelle_sessions
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

drop policy if exists michelle_messages_select on public.michelle_messages;
create policy michelle_messages_select
  on public.michelle_messages
  for select using (
    exists (
      select 1 from public.michelle_sessions ms
      where ms.id = michelle_messages.session_id
        and ms.auth_user_id = auth.uid()
    )
  );

drop policy if exists michelle_messages_insert on public.michelle_messages;
create policy michelle_messages_insert
  on public.michelle_messages
  for insert with check (
    exists (
      select 1 from public.michelle_sessions ms
      where ms.id = michelle_messages.session_id
        and ms.auth_user_id = auth.uid()
    )
  );

drop policy if exists michelle_knowledge_service_role on public.michelle_knowledge;
create policy michelle_knowledge_service_role
  on public.michelle_knowledge
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists michelle_knowledge_parents_service_role on public.michelle_knowledge_parents;
create policy michelle_knowledge_parents_service_role
  on public.michelle_knowledge_parents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists michelle_knowledge_children_service_role on public.michelle_knowledge_children;
create policy michelle_knowledge_children_service_role
  on public.michelle_knowledge_children
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.match_michelle_knowledge(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold double precision default 0.65
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    mk.id,
    mk.content,
    mk.metadata,
    1 - (mk.embedding <=> query_embedding) as similarity
  from public.michelle_knowledge mk
  where mk.embedding is not null
    and 1 - (mk.embedding <=> query_embedding) >= similarity_threshold
  order by mk.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.match_michelle_knowledge_sinr(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold double precision default 0.65
)
returns table (
  parent_id uuid,
  parent_content text,
  parent_metadata jsonb,
  parent_source text,
  child_similarity double precision
)
language sql
stable
as $$
  select distinct on (p.id)
    p.id as parent_id,
    p.content as parent_content,
    p.metadata as parent_metadata,
    p.source as parent_source,
    1 - (c.embedding <=> query_embedding) as child_similarity
  from public.michelle_knowledge_children c
  join public.michelle_knowledge_parents p on c.parent_id = p.id
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by p.id, c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- Clinical Psychology AI Counselor (Dr. Sato SINR対応) -------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'clinical_message_role') then
    create type clinical_message_role as enum ('user', 'assistant', 'system');
  end if;
end$$;

create table if not exists public.clinical_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references public.users(id) on delete cascade,
  title text,
  openai_thread_id text,
  total_tokens integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinical_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.clinical_sessions(id) on delete cascade,
  role clinical_message_role not null,
  content text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinical_knowledge_parents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null,
  parent_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinical_knowledge_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.clinical_knowledge_parents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  child_index integer not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists clinical_sessions_user_idx on public.clinical_sessions (auth_user_id);
create index if not exists clinical_messages_session_idx on public.clinical_messages (session_id);
create index if not exists clinical_knowledge_parents_source_idx on public.clinical_knowledge_parents(source);
create index if not exists clinical_knowledge_children_parent_idx on public.clinical_knowledge_children(parent_id);
create index if not exists clinical_knowledge_children_embedding_idx
  on public.clinical_knowledge_children using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.clinical_sessions enable row level security;
alter table public.clinical_messages enable row level security;
alter table public.clinical_knowledge_parents enable row level security;
alter table public.clinical_knowledge_children enable row level security;

drop policy if exists clinical_sessions_select_own on public.clinical_sessions;
create policy clinical_sessions_select_own
  on public.clinical_sessions
  for select using (auth.uid() = auth_user_id);

drop policy if exists clinical_sessions_mutate_own on public.clinical_sessions;
create policy clinical_sessions_mutate_own
  on public.clinical_sessions
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

drop policy if exists clinical_messages_select on public.clinical_messages;
create policy clinical_messages_select
  on public.clinical_messages
  for select using (
    exists (
      select 1 from public.clinical_sessions cs
      where cs.id = clinical_messages.session_id
        and cs.auth_user_id = auth.uid()
    )
  );

drop policy if exists clinical_messages_insert on public.clinical_messages;
create policy clinical_messages_insert
  on public.clinical_messages
  for insert with check (
    exists (
      select 1 from public.clinical_sessions cs
      where cs.id = clinical_messages.session_id
        and cs.auth_user_id = auth.uid()
    )
  );

drop policy if exists clinical_knowledge_parents_service_role on public.clinical_knowledge_parents;
create policy clinical_knowledge_parents_service_role
  on public.clinical_knowledge_parents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists clinical_knowledge_children_service_role on public.clinical_knowledge_children;
create policy clinical_knowledge_children_service_role
  on public.clinical_knowledge_children
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.match_clinical_knowledge_sinr(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold double precision default 0.65
)
returns table (
  parent_id uuid,
  parent_content text,
  parent_metadata jsonb,
  parent_source text,
  child_similarity double precision
)
language sql
stable
as $$
  select distinct on (p.id)
    p.id as parent_id,
    p.content as parent_content,
    p.metadata as parent_metadata,
    p.source as parent_source,
    1 - (c.embedding <=> query_embedding) as child_similarity
  from public.clinical_knowledge_children c
  join public.clinical_knowledge_parents p on c.parent_id = p.id
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by p.id, c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

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
