-- Circle broadcast inquiries (guest referral to trusted peers)
create table if not exists public.circle_broadcasts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  check_in date not null,
  check_out date not null,
  guest_count integer not null check (guest_count > 0),
  unit_type text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'fulfilled', 'expired')),
  created_at timestamptz not null default now()
);

alter table public.circle_broadcasts enable row level security;

create policy "Hosts can create broadcasts"
  on public.circle_broadcasts for insert
  with check (auth.uid() = host_id);

create policy "Hosts can view own broadcasts"
  on public.circle_broadcasts for select
  using (auth.uid() = host_id);

create policy "Circle peers can view broadcasts"
  on public.circle_broadcasts for select
  using (
    exists (
      select 1 from public.circles_network cn
      where cn.status = 'accepted'
      and cn.host_id = circle_broadcasts.host_id
      and cn.trusted_peer_id = auth.uid()
    )
  );
