-- UX redesign: short codes (3 letters + 4 digits), bedrooms, OCR quota

alter table public.properties
  add column if not exists bedrooms int not null default 1;

alter table public.profiles
  add column if not exists receipt_ocr_used_this_month int not null default 0,
  add column if not exists receipt_ocr_reset_at timestamptz default date_trunc('month', now()),
  add column if not exists vat_registered boolean not null default false,
  add column if not exists digitax_linked boolean not null default false;

create or replace function public.generate_host_short_code(name_hint text default null)
returns text
language plpgsql
as $$
declare
  candidate text;
  prefix text;
  digits text;
  clean text;
begin
  clean := upper(regexp_replace(coalesce(name_hint, ''), '[^A-Za-z]', '', 'g'));
  if length(clean) >= 3 then
    prefix := substring(clean from 1 for 3);
  elsif length(clean) > 0 then
    prefix := rpad(clean, 3, 'X');
  else
    prefix := 'EHX';
  end if;

  loop
    digits := lpad((floor(random() * 9000) + 1000)::text, 4, '0');
    candidate := prefix || digits;
    exit when not exists (select 1 from public.profiles where short_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Backfill legacy HOST-XXXX codes to ABC1234 format
update public.profiles p
set short_code = public.generate_host_short_code(coalesce(p.legal_name, p.full_name))
where short_code is null or short_code like 'HOST-%';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, short_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    public.generate_host_short_code(
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    )
  );
  return new;
end;
$$;

create table if not exists public.circle_invite_tokens (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  circle_id uuid references public.circles(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

alter table public.circle_invite_tokens enable row level security;

create policy "Inviters manage own tokens"
  on public.circle_invite_tokens for all
  using (inviter_id = auth.uid())
  with check (inviter_id = auth.uid());

create policy "Anyone can read valid tokens"
  on public.circle_invite_tokens for select
  using (expires_at > now());

grant select on public.circle_invite_tokens to anon, authenticated;
