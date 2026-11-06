select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events')
order by table_name;

select tablename, policyname, cmd, permissive
from pg_policies
where schemaname = 'public'
  and tablename in ('captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events')
order by tablename, policyname;

select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('captured_items','extracted_facts','people_entities','life_events','commitments','context_relationships','recommendations','user_actions','notification_preferences','audit_events')
order by tablename, indexname;
