# Life Context Graph

## Purpose

COMMON ONE stores a private, user-owned context graph that turns captures into reviewable facts, entities, events, commitments, recommendations, and actions. The database is intentionally additive and UUID-based so records can be synced across clients without exposing sequential identifiers.

## Relationship diagram

```text
profiles (auth.users)
  |
  +-- captured_items --------------------+
  |       |                              |
  |       +-- extracted_facts ----+      +-- life_events
  |                               |      +-- commitments
  |                               v
  +-- people_entities <---- context_relationships
  |       |
  |       +-- commitments
  |
  +-- recommendations ---- user_actions
  |
  +-- notification_preferences
  +-- audit_events
```

`captured_items` is the source-of-truth intake record. AI-derived tables retain `source_item_id`, confidence, and verification state so generated context remains explainable and reviewable. Entity relationships are scoped to one user and cannot connect records owned by different users.

## Tables

- `profiles`: one private profile per Supabase Auth user; existing table preserved.
- `captured_items`: private notes, documents, voice/photo metadata, links, and processing state. Binary content belongs in private storage; `storage_path` is only a pointer.
- `extracted_facts`: facts derived from a capture, with confidence and verification state.
- `people_entities`: normalized people, places, organizations, projects, and concepts.
- `life_events`: dated milestones and significant events.
- `commitments`: promises and responsibilities with due dates and lifecycle status.
- `context_relationships`: typed, weighted edges between entities.
- `recommendations`: explainable suggested actions with source item IDs and expiry.
- `user_actions`: the user’s response to a recommendation or manual action.
- `notification_preferences`: one row per user, defaulting to weekly email digest and UTC.
- `audit_events`: append-only system/user audit trail; client updates and deletes are intentionally denied.

## Security and privacy

- Every table is protected by RLS and scopes access to `auth.uid() = user_id`.
- Child ownership is validated by a `security definer` trigger before insert/update, preventing cross-user references even when UUIDs are guessed.
- User-owned rows cascade on Auth deletion. Optional source/entity links use `set null` where deleting a source should not erase derived history.
- Audit records are insert-only from the client surface. Server-side service code may append system events; never store access tokens, passwords, raw session cookies, or unnecessary PII in `payload`.
- `sensitivity` distinguishes ordinary private captures from sensitive captures and should be used to restrict exports, indexing, and notification copy at the application layer.
- `storage_path` must point to private storage. Do not put public URLs or provider credentials in database rows.

## Applying and verifying

The migration is `supabase/migrations/20261106000100_life_context_graph.sql`. Apply it through the connected Supabase MCP, not by exposing service-role credentials to the browser. Then verify with projected metadata only:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events')
order by table_name;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events')
order by tablename, policyname;
```
