-- Dev demo seed tagging (BYPASS_AUTH + DEV_SEED_ENABLED only)

create table if not exists public.demo_seed_state (
  id int primary key default 1 check (id = 1),
  batch_id uuid not null,
  host_profile_id uuid references public.profiles(id) on delete set null,
  seeded_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists demo_seed_batch_id uuid;

alter table public.properties
  add column if not exists demo_seed_batch_id uuid;

alter table public.bookings
  add column if not exists demo_seed_batch_id uuid;

alter table public.expenses
  add column if not exists demo_seed_batch_id uuid;

alter table public.inventory
  add column if not exists demo_seed_batch_id uuid;

alter table public.inventory_rules
  add column if not exists demo_seed_batch_id uuid;

alter table public.operational_tasks
  add column if not exists demo_seed_batch_id uuid;

alter table public.invoices
  add column if not exists demo_seed_batch_id uuid;

alter table public.circles
  add column if not exists demo_seed_batch_id uuid;

alter table public.circle_members
  add column if not exists demo_seed_batch_id uuid;

alter table public.circle_invitations
  add column if not exists demo_seed_batch_id uuid;

create index if not exists idx_properties_demo_seed on public.properties (demo_seed_batch_id)
  where demo_seed_batch_id is not null;

create index if not exists idx_bookings_demo_seed on public.bookings (demo_seed_batch_id)
  where demo_seed_batch_id is not null;

create index if not exists idx_expenses_demo_seed on public.expenses (demo_seed_batch_id)
  where demo_seed_batch_id is not null;
