-- Per-unit privacy control for Circles availability search (section 3e)

alter table public.properties
  add column if not exists visible_to_circle boolean not null default true;
