-- Mochi and Tilapya, looked after by everyone who visits the desk (/desk):
-- when each was last fed and played with, and a few counters of what
-- visitors have done in the room. Run this once in the Supabase SQL editor.
--
-- Anyone can read them. Nobody writes to the tables directly: the one way
-- in is office_care(), which only ever stamps now() or adds one, so a
-- visitor can't backdate a meal or set a counter to whatever they like.

create table if not exists public.office_cats (
  name text primary key check (name in ('mochi', 'tilapya')),
  fed_at timestamptz not null default now(),
  played_at timestamptz not null default now()
);
insert into public.office_cats (name) values ('mochi'), ('tilapya') on conflict do nothing;

create table if not exists public.office_counters (
  key text primary key check (key in ('visits', 'pets_mochi', 'pets_tilapya', 'treats', 'lasers')),
  value bigint not null default 0
);
insert into public.office_counters (key)
  values ('visits'), ('pets_mochi'), ('pets_tilapya'), ('treats'), ('lasers')
  on conflict do nothing;

alter table public.office_cats enable row level security;
alter table public.office_counters enable row level security;

create policy "The cats are public" on public.office_cats
  for select to anon, authenticated using (true);
create policy "The counters are public" on public.office_counters
  for select to anon, authenticated using (true);

create or replace function public.office_care(p_action text, p_cat text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action = 'visit' then
    update office_counters set value = value + 1 where key = 'visits';
    return;
  end if;
  if p_cat not in ('mochi', 'tilapya', 'both') then
    raise exception 'unknown cat';
  end if;
  if p_action = 'feed' then
    update office_cats set fed_at = now() where p_cat = 'both' or name = p_cat;
    update office_counters set value = value + 1 where key = 'treats';
  elsif p_action = 'play' then
    update office_cats set played_at = now() where p_cat = 'both' or name = p_cat;
    update office_counters set value = value + 1 where key = 'lasers';
  elsif p_action = 'pet' and p_cat <> 'both' then
    update office_cats set played_at = now() where name = p_cat;
    update office_counters set value = value + 1 where key = 'pets_' || p_cat;
  else
    raise exception 'unknown action';
  end if;
end;
$$;

revoke all on function public.office_care(text, text) from public;
grant execute on function public.office_care(text, text) to anon, authenticated;
