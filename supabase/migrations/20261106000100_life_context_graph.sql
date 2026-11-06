-- COMMON ONE: Life Context Graph
-- Additive migration. Safe to run after the existing profiles migration.

create extension if not exists pgcrypto;

do $$ begin
  create type public.capture_type as enum ('note','document','conversation','photo','voice_memo','email','task','bookmark','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.processing_status as enum ('queued','processing','processed','needs_review','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.entity_type as enum ('person','place','organization','project','concept');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.commitment_status as enum ('active','completed','paused','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.recommendation_status as enum ('proposed','accepted','dismissed','completed','expired');
exception when duplicate_object then null; end $$;

create table if not exists public.captured_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_type public.capture_type not null default 'note',
  title text,
  content text not null default '',
  storage_path text,
  source_url text,
  occurred_at timestamptz,
  captured_at timestamptz not null default now(),
  processing_status public.processing_status not null default 'queued',
  processed_at timestamptz,
  sensitivity text not null default 'private' check (sensitivity in ('private','sensitive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.people_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  entity_type public.entity_type not null default 'person',
  email text,
  notes text,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  source_count integer not null default 0 check (source_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extracted_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_item_id uuid not null references public.captured_items(id) on delete cascade,
  subject_entity_id uuid references public.people_entities(id) on delete set null,
  fact_type text not null,
  fact_text text not null,
  value jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.life_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'milestone',
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  source_item_id uuid references public.captured_items(id) on delete set null,
  importance smallint not null default 3 check (importance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  commitment_type text not null default 'personal',
  status public.commitment_status not null default 'active',
  due_at timestamptz,
  completed_at timestamptz,
  person_entity_id uuid references public.people_entities(id) on delete set null,
  source_item_id uuid references public.captured_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.context_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_entity_id uuid not null references public.people_entities(id) on delete cascade,
  to_entity_id uuid not null references public.people_entities(id) on delete cascade,
  relationship_type text not null,
  strength numeric(4,3) check (strength is null or strength between 0 and 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_entity_id <> to_entity_id),
  unique (user_id, from_entity_id, to_entity_id, relationship_type)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  rationale text not null,
  suggested_action text,
  priority smallint not null default 3 check (priority between 1 and 5),
  status public.recommendation_status not null default 'proposed',
  source_item_ids uuid[] not null default '{}',
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  action_type text not null,
  action_payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'UTC',
  digest_frequency text not null default 'weekly' check (digest_frequency in ('never','daily','weekly')),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_type text not null default 'user' check (actor_type in ('user','system')),
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists captured_items_user_captured_idx on public.captured_items(user_id, captured_at desc);
create index if not exists captured_items_user_status_idx on public.captured_items(user_id, processing_status);
create index if not exists extracted_facts_user_source_idx on public.extracted_facts(user_id, source_item_id);
create index if not exists people_entities_user_name_idx on public.people_entities(user_id, lower(display_name));
create index if not exists life_events_user_start_idx on public.life_events(user_id, starts_at);
create index if not exists commitments_user_status_due_idx on public.commitments(user_id, status, due_at);
create index if not exists relationships_user_from_idx on public.context_relationships(user_id, from_entity_id);
create index if not exists relationships_user_to_idx on public.context_relationships(user_id, to_entity_id);
create index if not exists recommendations_user_status_priority_idx on public.recommendations(user_id, status, priority);
create index if not exists user_actions_user_created_idx on public.user_actions(user_id, created_at desc);
create index if not exists audit_events_user_created_idx on public.audit_events(user_id, created_at desc);

-- Every table is private to the authenticated owner. Audit events are insert-only for clients.
do $$ declare table_name text; begin
  foreach table_name in array array['captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_select_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_insert_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_update_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_delete_own on public.%I', table_name, table_name);
    execute format('create policy %I_select_own on public.%I for select using (auth.uid() = user_id)', table_name, table_name);
    execute format('create policy %I_insert_own on public.%I for insert with check (auth.uid() = user_id)', table_name, table_name);
    if table_name <> 'audit_events' then
      execute format('create policy %I_update_own on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
      execute format('create policy %I_delete_own on public.%I for delete using (auth.uid() = user_id)', table_name, table_name);
    end if;
  end loop;
end $$;

-- Child rows must never cross user boundaries, even if a caller supplies another user's UUID.
create or replace function public.validate_life_context_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'extracted_facts' and not exists (select 1 from public.captured_items where id = new.source_item_id and user_id = new.user_id) then raise exception 'source item ownership mismatch'; end if;
  if tg_table_name = 'extracted_facts' and new.subject_entity_id is not null and not exists (select 1 from public.people_entities where id = new.subject_entity_id and user_id = new.user_id) then raise exception 'entity ownership mismatch'; end if;
  if tg_table_name = 'context_relationships' and (not exists (select 1 from public.people_entities where id = new.from_entity_id and user_id = new.user_id) or not exists (select 1 from public.people_entities where id = new.to_entity_id and user_id = new.user_id)) then raise exception 'relationship entity ownership mismatch'; end if;
  if tg_table_name = 'commitments' and new.person_entity_id is not null and not exists (select 1 from public.people_entities where id = new.person_entity_id and user_id = new.user_id) then raise exception 'commitment entity ownership mismatch'; end if;
  return new;
end; $$;

drop trigger if exists extracted_facts_owner_check on public.extracted_facts;
create trigger extracted_facts_owner_check before insert or update on public.extracted_facts for each row execute function public.validate_life_context_owner();
drop trigger if exists relationships_owner_check on public.context_relationships;
create trigger relationships_owner_check before insert or update on public.context_relationships for each row execute function public.validate_life_context_owner();
drop trigger if exists commitments_owner_check on public.commitments;
create trigger commitments_owner_check before insert or update on public.commitments for each row execute function public.validate_life_context_owner();
