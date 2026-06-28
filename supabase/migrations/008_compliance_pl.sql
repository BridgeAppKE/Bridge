-- Phase 5: Compliance + P&L invoice extensions

do $$ begin
  create type public.invoice_status as enum (
    'private_only',
    'draft_review',
    'filed_etims',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

alter table public.invoices
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists gross_amount numeric,
  add column if not exists vat_amount numeric,
  add column if not exists net_amount numeric,
  add column if not exists status public.invoice_status not null default 'private_only',
  add column if not exists buyer_kra_pin text,
  add column if not exists etims_receipt_number text;

update public.invoices i
set
  property_id = b.property_id,
  gross_amount = total_amount,
  net_amount = total_amount,
  vat_amount = 0
from public.bookings b
where i.booking_id = b.id
  and i.property_id is null;

create or replace view public.pl_summary as
with booking_revenue as (
  select
    p.owner_id as host_id,
    p.id as property_id,
    p.name as property_name,
    date_trunc('month', b.start_date::timestamptz) as period_month,
    coalesce(sum(p.base_rate_kes), 0) as booking_revenue
  from public.properties p
  left join public.bookings b
    on b.property_id = p.id and b.is_manual_block = false
  group by p.owner_id, p.id, p.name, date_trunc('month', b.start_date::timestamptz)
),
expense_totals as (
  select
    e.property_id,
    date_trunc('month', coalesce(e.incurred_at, e.date::timestamptz)) as period_month,
    coalesce(sum(e.amount_kes), 0) as expense_total
  from public.expenses e
  group by e.property_id, date_trunc('month', coalesce(e.incurred_at, e.date::timestamptz))
)
select
  br.host_id,
  br.property_id,
  br.property_name,
  br.period_month,
  br.booking_revenue,
  coalesce(et.expense_total, 0) as expense_total
from booking_revenue br
left join expense_totals et
  on et.property_id = br.property_id
  and et.period_month = br.period_month;

grant select on public.pl_summary to authenticated;
