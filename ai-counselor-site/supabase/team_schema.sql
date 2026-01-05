-- Team counseling sessions and messages schema

-- Team message role enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_message_role') then
    create type team_message_role as enum ('user', 'assistant');
  end if;
end$$;

-- Team sessions table
create table if not exists public.team_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references public.users(id) on delete cascade,
  title text,
  participants text[] not null default '{}', -- Array of counselor IDs
  total_tokens integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Team messages table
create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  team_session_id uuid not null references public.team_sessions(id) on delete cascade,
  role team_message_role not null,
  content text not null,
  author text, -- AI counselor name (null for user messages)
  author_id text, -- AI counselor ID (null for user messages)
  icon_url text, -- AI counselor icon URL
  tokens integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Indexes
create index if not exists team_sessions_auth_user_id_idx on public.team_sessions(auth_user_id);
create index if not exists team_sessions_updated_at_idx on public.team_sessions(updated_at desc);
create index if not exists team_messages_team_session_id_idx on public.team_messages(team_session_id);
create index if not exists team_messages_created_at_idx on public.team_messages(created_at);

-- RLS policies
alter table public.team_sessions enable row level security;
alter table public.team_messages enable row level security;

-- Team sessions policies
create policy "Users can view their own team sessions"
  on public.team_sessions for select
  using (auth.uid() = auth_user_id);

create policy "Users can insert their own team sessions"
  on public.team_sessions for insert
  with check (auth.uid() = auth_user_id);

create policy "Users can update their own team sessions"
  on public.team_sessions for update
  using (auth.uid() = auth_user_id);

create policy "Users can delete their own team sessions"
  on public.team_sessions for delete
  using (auth.uid() = auth_user_id);

-- Team messages policies
create policy "Users can view messages from their team sessions"
  on public.team_messages for select
  using (exists (
    select 1 from public.team_sessions
    where team_sessions.id = team_messages.team_session_id
    and team_sessions.auth_user_id = auth.uid()
  ));

create policy "Users can insert messages to their team sessions"
  on public.team_messages for insert
  with check (exists (
    select 1 from public.team_sessions
    where team_sessions.id = team_messages.team_session_id
    and team_sessions.auth_user_id = auth.uid()
  ));

create policy "Users can update messages in their team sessions"
  on public.team_messages for update
  using (exists (
    select 1 from public.team_sessions
    where team_sessions.id = team_messages.team_session_id
    and team_sessions.auth_user_id = auth.uid()
  ));

create policy "Users can delete messages from their team sessions"
  on public.team_messages for delete
  using (exists (
    select 1 from public.team_sessions
    where team_sessions.id = team_messages.team_session_id
    and team_sessions.auth_user_id = auth.uid()
  ));
