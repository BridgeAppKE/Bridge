-- Phase 4: Operations — staff tasks and photo proofs

create type public.task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  staff_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (host_id, staff_id, property_id)
);

create table if not exists public.operational_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  title text not null,
  status public.task_status not null default 'pending',
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.task_proofs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.operational_tasks(id) on delete cascade not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.staff_assignments enable row level security;
alter table public.operational_tasks enable row level security;
alter table public.task_proofs enable row level security;

create policy "Hosts manage staff assignments"
  on public.staff_assignments for all
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "Staff view own assignments"
  on public.staff_assignments for select
  using (staff_id = auth.uid());

create policy "Hosts manage operational tasks"
  on public.operational_tasks for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = operational_tasks.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = operational_tasks.property_id and p.owner_id = auth.uid()
    )
  );

create policy "Assigned staff view tasks"
  on public.operational_tasks for select
  using (assigned_to = auth.uid());

create policy "Assigned staff update tasks"
  on public.operational_tasks for update
  using (assigned_to = auth.uid());

create policy "Task proof access"
  on public.task_proofs for all
  using (
    exists (
      select 1 from public.operational_tasks t
      join public.properties p on p.id = t.property_id
      where t.id = task_proofs.task_id
      and (p.owner_id = auth.uid() or t.assigned_to = auth.uid())
    )
  );

insert into storage.buckets (id, name, public)
values ('task-proofs', 'task-proofs', false)
on conflict (id) do nothing;
