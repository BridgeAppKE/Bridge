-- Task type badges + cleaner WhatsApp notify (section 5)

alter table public.operational_tasks
  add column if not exists task_type text not null default 'Other';

alter table public.properties
  add column if not exists cleaner_phone text;
