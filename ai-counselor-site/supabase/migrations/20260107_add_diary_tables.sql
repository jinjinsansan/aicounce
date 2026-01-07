-- Diary tables for daily AI counselor posts

set search_path = public;

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  author_id text not null,
  author_name text not null,
  author_avatar_url text,
  title text,
  content text not null,
  published_at timestamptz not null default timezone('utc', now()),
  journal_date date not null,
  is_shareable boolean not null default true,
  share_count integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists idx_diary_entries_date on public.diary_entries (journal_date desc, published_at desc);
create index if not exists idx_diary_entries_author on public.diary_entries (author_id);

create table if not exists public.diary_state (
  id uuid primary key default gen_random_uuid(),
  counselor_id text not null unique,
  last_chunk_path text,
  last_index integer,
  last_journal_date date,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.diary_entries is 'Daily AI counselor diary posts for the public feed.';
comment on table public.diary_state is 'State for rotating RAG chunks per counselor when auto-posting diaries.';

create or replace function public.increment_diary_share_count(target_entry_id uuid)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  update public.diary_entries
  set share_count = share_count + 1,
      updated_at = timezone('utc', now())
  where id = target_entry_id
  returning share_count into new_count;

  return coalesce(new_count, 0);
end;
$$;
