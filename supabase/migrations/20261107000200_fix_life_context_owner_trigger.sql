-- Fix owner validation for tables with different row shapes.
-- The previous trigger function referenced NEW fields from other tables and failed
-- before evaluating the table-name branches. JSON field access keeps validation
-- explicit without weakening ownership checks.

create or replace function public.validate_life_context_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(new);
  owner_id uuid := (row_data ->> 'user_id')::uuid;
  source_id uuid;
  entity_id uuid;
  from_id uuid;
  to_id uuid;
begin
  if tg_table_name = 'extracted_facts' then
    source_id := (row_data ->> 'source_item_id')::uuid;
    entity_id := nullif(row_data ->> 'subject_entity_id', '')::uuid;
    if not exists (select 1 from public.captured_items where id = source_id and user_id = owner_id) then
      raise exception 'source item ownership mismatch';
    end if;
    if entity_id is not null and not exists (select 1 from public.people_entities where id = entity_id and user_id = owner_id) then
      raise exception 'entity ownership mismatch';
    end if;
  elsif tg_table_name = 'context_relationships' then
    from_id := (row_data ->> 'from_entity_id')::uuid;
    to_id := (row_data ->> 'to_entity_id')::uuid;
    if not exists (select 1 from public.people_entities where id = from_id and user_id = owner_id)
       or not exists (select 1 from public.people_entities where id = to_id and user_id = owner_id) then
      raise exception 'relationship entity ownership mismatch';
    end if;
  elsif tg_table_name = 'commitments' then
    entity_id := nullif(row_data ->> 'person_entity_id', '')::uuid;
    if entity_id is not null and not exists (select 1 from public.people_entities where id = entity_id and user_id = owner_id) then
      raise exception 'commitment entity ownership mismatch';
    end if;
  end if;
  return new;
end;
$$;
