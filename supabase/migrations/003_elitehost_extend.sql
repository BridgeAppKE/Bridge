-- EliteHost schema extensions (keep existing table names)

alter table public.properties
  add column if not exists ical_url text,
  add column if not exists last_synced_at timestamptz;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  is_manual_block boolean not null default false,
  guest_count integer,
  external_uid text,
  created_at timestamptz not null default now(),
  unique (property_id, external_uid)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade not null,
  total_amount numeric not null check (total_amount > 0),
  pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.invoices enable row level security;

-- Bookings: owners manage own unit bookings
create policy "Property owners manage bookings"
  on public.bookings for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id and p.owner_id = auth.uid()
    )
  );

-- Circle peers can view bookings for visibility
create policy "Circle peers can view bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.properties p
      join public.circles_network cn on cn.status = 'accepted'
      where p.id = bookings.property_id
      and (
        (cn.host_id = p.owner_id and cn.trusted_peer_id = auth.uid())
        or (cn.trusted_peer_id = p.owner_id and cn.host_id = auth.uid())
      )
    )
    or exists (
      select 1 from public.properties p
      where p.id = bookings.property_id and p.owner_id = auth.uid()
    )
  );

-- Invoices: owners via booking -> property
create policy "Property owners manage invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.bookings b
      join public.properties p on p.id = b.property_id
      where b.id = invoices.booking_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      join public.properties p on p.id = b.property_id
      where b.id = invoices.booking_id and p.owner_id = auth.uid()
    )
  );
