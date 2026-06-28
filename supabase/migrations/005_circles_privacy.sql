-- Phase 2: Privacy-scoped Circles (replace flat circles_network)

do $$ begin
  create type public.invite_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique (circle_id, profile_id)
);

create table if not exists public.circle_invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (circle_id, receiver_id)
);

-- Migrate legacy circles_network into isolated circles (one circle per pair)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'circles_network'
  ) then
    insert into public.circles (id, name, created_by, created_at)
    select
      gen_random_uuid(),
      'Circle · ' || cn.id::text,
      cn.host_id,
      cn.created_at
    from public.circles_network cn
    where not exists (
      select 1 from public.circles c where c.name = 'Circle · ' || cn.id::text
    );

    insert into public.circle_members (circle_id, profile_id, joined_at)
    select c.id, cn.host_id, cn.created_at
    from public.circles_network cn
    join public.circles c on c.name = 'Circle · ' || cn.id::text
    on conflict do nothing;

    insert into public.circle_members (circle_id, profile_id, joined_at)
    select c.id, cn.trusted_peer_id, cn.created_at
    from public.circles_network cn
    join public.circles c on c.name = 'Circle · ' || cn.id::text
    where cn.status = 'accepted'
    on conflict do nothing;

    insert into public.circle_invitations (circle_id, sender_id, receiver_id, status, created_at)
    select c.id, cn.host_id, cn.trusted_peer_id,
      case cn.status when 'accepted' then 'accepted'::public.invite_status else 'pending'::public.invite_status end,
      cn.created_at
    from public.circles_network cn
    join public.circles c on c.name = 'Circle · ' || cn.id::text
    on conflict do nothing;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'circle_broadcasts'
  ) then
    alter table public.circle_broadcasts
      add column if not exists circle_id uuid references public.circles(id) on delete set null;

    update public.circle_broadcasts cb
    set circle_id = (
      select cm.circle_id
      from public.circle_members cm
      where cm.profile_id = cb.host_id
      order by cm.joined_at
      limit 1
    )
    where cb.circle_id is null;

    drop policy if exists "Circle peers can view broadcasts" on public.circle_broadcasts;

    create policy "Circle-scoped broadcast view"
      on public.circle_broadcasts for select
      using (
        host_id = auth.uid()
        or exists (
          select 1 from public.circle_members cm
          where cm.circle_id = circle_broadcasts.circle_id
          and cm.profile_id = auth.uid()
        )
      );
  end if;
end $$;

-- Drop flat-network policies
drop policy if exists "Circle members can view peer properties" on public.properties;
drop policy if exists "Users can view circle peer profiles" on public.profiles;
drop policy if exists "Circle peers can view bookings" on public.bookings;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'circles_network') then
    drop policy if exists "Users can view their circles" on public.circles_network;
    drop policy if exists "Hosts can send circle invites" on public.circles_network;
    drop policy if exists "Users can update their circle connections" on public.circles_network;
    drop policy if exists "Hosts can delete circle invites" on public.circles_network;
  end if;
end $$;

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_invitations enable row level security;

-- Helper: same circle membership
create or replace function public.shares_circle_with(viewer uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members a
    join public.circle_members b on a.circle_id = b.circle_id
    where a.profile_id = viewer and b.profile_id = owner
  );
$$;

-- Circles RLS
drop policy if exists "Members view circles" on public.circles;
create policy "Members view circles"
  on public.circles for select
  using (
    exists (
      select 1 from public.circle_members cm
      where cm.circle_id = circles.id and cm.profile_id = auth.uid()
    )
    or created_by = auth.uid()
  );

drop policy if exists "Hosts create circles" on public.circles;
create policy "Hosts create circles"
  on public.circles for insert
  with check (created_by = auth.uid());

drop policy if exists "Creators update circles" on public.circles;
create policy "Creators update circles"
  on public.circles for update
  using (created_by = auth.uid());

-- Circle members RLS
drop policy if exists "Members view circle_members" on public.circle_members;
create policy "Members view circle_members"
  on public.circle_members for select
  using (
    exists (
      select 1 from public.circle_members cm
      where cm.circle_id = circle_members.circle_id and cm.profile_id = auth.uid()
    )
  );

drop policy if exists "Circle creators add members" on public.circle_members;
create policy "Circle creators add members"
  on public.circle_members for insert
  with check (
    exists (
      select 1 from public.circles c
      where c.id = circle_members.circle_id and c.created_by = auth.uid()
    )
    or profile_id = auth.uid()
  );

-- Invitations RLS
drop policy if exists "Parties view invitations" on public.circle_invitations;
create policy "Parties view invitations"
  on public.circle_invitations for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Senders create invitations" on public.circle_invitations;
create policy "Senders create invitations"
  on public.circle_invitations for insert
  with check (sender_id = auth.uid());

drop policy if exists "Receivers update invitations" on public.circle_invitations;
create policy "Receivers update invitations"
  on public.circle_invitations for update
  using (receiver_id = auth.uid());

-- Scoped property visibility
drop policy if exists "Circle-scoped peer property view" on public.properties;
create policy "Circle-scoped peer property view"
  on public.properties for select
  using (
    auth.uid() = owner_id
    or public.shares_circle_with(auth.uid(), owner_id)
  );

-- Scoped profile visibility for circle peers
drop policy if exists "Circle-scoped peer profile view" on public.profiles;
create policy "Circle-scoped peer profile view"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.shares_circle_with(auth.uid(), id)
  );

-- Scoped booking visibility
drop policy if exists "Circle-scoped peer booking view" on public.bookings;
create policy "Circle-scoped peer booking view"
  on public.bookings for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id
      and (p.owner_id = auth.uid() or public.shares_circle_with(auth.uid(), p.owner_id))
    )
  );

-- Scoped broadcast visibility handled above when table exists

drop table if exists public.circles_network cascade;

grant execute on function public.shares_circle_with(uuid, uuid) to authenticated;
