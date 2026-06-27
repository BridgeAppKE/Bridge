-- BnBplus initial schema for short-term rental hosts (Kenya)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  subscription_status text not null default 'trial',
  monthly_fixed_costs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  zodomus_property_id text,
  created_at timestamptz not null default now()
);

-- Circles trust network
create table if not exists public.circles_network (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  trusted_peer_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (host_id, trusted_peer_id),
  check (host_id <> trusted_peer_id)
);

-- Inventory rules
create table if not exists public.inventory_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  item_name text not null,
  usage_per_guest numeric not null check (usage_per_guest >= 0),
  current_stock numeric not null default 0 check (current_stock >= 0),
  alert_threshold numeric not null default 0 check (alert_threshold >= 0),
  created_at timestamptz not null default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  amount_kes numeric not null check (amount_kes > 0),
  category text not null,
  date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- Lookup user by email for Circle invites
create or replace function public.get_user_id_by_email(user_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(user_email) limit 1;
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.circles_network enable row level security;
alter table public.inventory_rules enable row level security;
alter table public.expenses enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view circle peer profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.circles_network cn
      where cn.status = 'accepted'
      and (
        (cn.host_id = auth.uid() and cn.trusted_peer_id = profiles.id)
        or (cn.trusted_peer_id = auth.uid() and cn.host_id = profiles.id)
      )
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Properties policies
create policy "Owners can manage own properties"
  on public.properties for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Circle members can view peer properties"
  on public.properties for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.circles_network cn
      where cn.status = 'accepted'
      and (
        (cn.host_id = auth.uid() and cn.trusted_peer_id = properties.owner_id)
        or (cn.trusted_peer_id = auth.uid() and cn.host_id = properties.owner_id)
      )
    )
  );

-- Circles policies
create policy "Users can view their circles"
  on public.circles_network for select
  using (auth.uid() = host_id or auth.uid() = trusted_peer_id);

create policy "Hosts can send circle invites"
  on public.circles_network for insert
  with check (auth.uid() = host_id);

create policy "Users can update their circle connections"
  on public.circles_network for update
  using (auth.uid() = host_id or auth.uid() = trusted_peer_id);

create policy "Hosts can delete circle invites"
  on public.circles_network for delete
  using (auth.uid() = host_id);

-- Inventory policies
create policy "Property owners manage inventory"
  on public.inventory_rules for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = inventory_rules.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = inventory_rules.property_id and p.owner_id = auth.uid()
    )
  );

-- Expenses policies
create policy "Property owners manage expenses"
  on public.expenses for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = expenses.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = expenses.property_id and p.owner_id = auth.uid()
    )
  );

-- Storage bucket for receipt images
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Users can upload receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own receipts"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
