-- PMS foundation: onboarding, multi-channel iCal, host codes

create type public.user_role as enum ('host', 'staff');

alter table public.profiles
  add column if not exists phone text,
  add column if not exists legal_name text,
  add column if not exists kra_pin text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists short_code text unique,
  add column if not exists role public.user_role not null default 'host',
  add column if not exists etims_opt_in boolean not null default false,
  add column if not exists etims_api_key_encrypted text,
  add column if not exists ical_setup_deferred boolean not null default false,
  add column if not exists ical_nudge_dismissed_at timestamptz;

alter table public.properties
  add column if not exists location text,
  add column if not exists base_rate_kes numeric(10, 2),
  add column if not exists ical_export_token uuid unique default gen_random_uuid();

update public.properties
set ical_export_token = gen_random_uuid()
where ical_export_token is null;

create table if not exists public.ical_feeds (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  platform_name text not null,
  url text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (property_id, platform_name)
);

-- Migrate legacy single ical_url into ical_feeds
insert into public.ical_feeds (property_id, platform_name, url, last_synced_at)
select id, 'Airbnb', ical_url, last_synced_at
from public.properties
where ical_url is not null and ical_url <> ''
on conflict (property_id, platform_name) do nothing;

alter table public.ical_feeds enable row level security;

create policy "Property owners manage ical feeds"
  on public.ical_feeds for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = ical_feeds.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = ical_feeds.property_id and p.owner_id = auth.uid()
    )
  );

-- Generate HOST-XXXX short codes for existing profiles
update public.profiles
set short_code = 'HOST-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0')
where short_code is null;

create or replace function public.generate_host_short_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'HOST-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0');
    exit when not exists (select 1 from public.profiles where short_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, short_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    public.generate_host_short_code()
  );
  return new;
end;
$$;

create or replace function public.lookup_host_by_code(code text)
returns table (
  profile_id uuid,
  display_name text,
  active_unit_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as profile_id,
    coalesce(p.legal_name, p.full_name, 'Host') as display_name,
    count(pr.id) as active_unit_count
  from public.profiles p
  left join public.properties pr on pr.owner_id = p.id
  where upper(trim(p.short_code)) = upper(trim(code))
  group by p.id, p.legal_name, p.full_name
  limit 1;
$$;

-- Existing hosts with units skip onboarding
update public.profiles p
set onboarding_completed = true
where exists (select 1 from public.properties pr where pr.owner_id = p.id);

grant execute on function public.lookup_host_by_code(text) to authenticated;
