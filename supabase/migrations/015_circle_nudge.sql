-- Profile completeness nudge for empty circles (section 8c)

alter table public.profiles
  add column if not exists circle_nudge_dismissed_at timestamptz;
