import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SQL_SCHEMA = `
-- Core table (extensible via metadata JSONB)
create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  type text not null check (type in ('note', 'image')),
  content text not null,
  metadata jsonb default '{}',
  folder_id uuid references folders(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Folders (nested)
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now()
);

-- Tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  color text default '#58a6ff',
  created_at timestamptz default now()
);

-- Many-to-many: artifact tags
create table if not exists artifact_tags (
  artifact_id uuid not null references artifacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (artifact_id, tag_id)
);

-- Full-text search index
alter table artifacts add column if not exists search_tsvector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;
create index if not exists artifacts_search_idx on artifacts using gin(search_tsvector);

-- Row Level Security
alter table artifacts enable row level security;
alter table folders enable row level security;
alter table tags enable row level security;
alter table artifact_tags enable row level security;

create policy "Users see only their own data" on artifacts for all using (auth.uid() = user_id);
create policy "Users see only their own data" on folders for all using (auth.uid() = user_id);
create policy "Users see only their own data" on tags for all using (auth.uid() = user_id);
create policy "Users see only their own data" on artifact_tags for all using auth.uid() in (select user_id from artifacts where artifacts.id = artifact_tags.artifact_id) and auth.uid() in (select user_id from tags where tags.id = artifact_tags.tag_id);
`;
