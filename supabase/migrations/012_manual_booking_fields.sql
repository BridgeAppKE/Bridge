-- Manual offline booking entry fields (Calendar section 2b)

alter table public.bookings
  add column if not exists guest_name text,
  add column if not exists guest_phone text,
  add column if not exists bedroom_type text,
  add column if not exists amount_kes numeric,
  add column if not exists payment_method text,
  add column if not exists notes text;
