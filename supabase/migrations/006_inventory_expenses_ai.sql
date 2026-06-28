-- Phase 3: Inventory tiers + expense AI fields

create type public.inventory_category as enum ('perishable', 'usable', 'non_perishable');
create type public.usable_status as enum ('available', 'laundry', 'damaged');

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  name text not null,
  category public.inventory_category not null default 'perishable',
  quantity numeric not null default 0,
  alert_threshold numeric not null default 0,
  usage_per_guest numeric not null default 1,
  usable_status public.usable_status,
  created_at timestamptz not null default now()
);

insert into public.inventory (
  property_id, name, category, quantity, alert_threshold, usage_per_guest, created_at
)
select
  ir.property_id,
  ir.item_name,
  'perishable'::public.inventory_category,
  ir.current_stock,
  ir.alert_threshold,
  ir.usage_per_guest,
  ir.created_at
from public.inventory_rules ir
where not exists (
  select 1 from public.inventory i
  where i.property_id = ir.property_id and i.name = ir.item_name
);

alter table public.expenses
  add column if not exists vendor_name text,
  add column if not exists vendor_kra_pin text,
  add column if not exists etims_invoice_number text,
  add column if not exists mpesa_reference_code text,
  add column if not exists is_verified_etims boolean not null default false,
  add column if not exists incurred_at timestamptz,
  add column if not exists ai_parsed jsonb;

update public.expenses
set incurred_at = (date::timestamptz)
where incurred_at is null and date is not null;

create unique index if not exists expenses_mpesa_reference_unique
  on public.expenses (mpesa_reference_code)
  where mpesa_reference_code is not null;

alter table public.inventory enable row level security;

create policy "Owners manage inventory"
  on public.inventory for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = inventory.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = inventory.property_id and p.owner_id = auth.uid()
    )
  );
