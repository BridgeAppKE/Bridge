-- Wipe public schema objects before BnB+ migration
-- Safe for Supabase: recreates public schema (standard reset pattern)

drop trigger if exists on_auth_user_created on auth.users;

drop policy if exists "Users can upload receipts" on storage.objects;
drop policy if exists "Users can view own receipts" on storage.objects;
drop policy if exists "Users can delete own receipts" on storage.objects;

drop function if exists public.get_user_id_by_email(text) cascade;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.expenses cascade;
drop table if exists public.inventory_rules cascade;
drop table if exists public.circles_network cascade;
drop table if exists public.properties cascade;
drop table if exists public.profiles cascade;

-- Remove any other leftover public tables from prior projects
do $$
declare
  r record;
begin
  for r in (
    select tablename
    from pg_tables
    where schemaname = 'public'
  ) loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end $$;
