-- Notes visitors pin to the cork board in the 3D office (/desk).
-- Run this once in the Supabase SQL editor of the portfolio's project.
-- To take a note down, set hidden = true on it in the table editor.
create table if not exists public.office_notes (
  id bigint generated always as identity primary key,
  name text not null default 'A visitor' check (char_length(name) between 1 and 24),
  body text not null check (char_length(body) between 1 and 80),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.office_notes enable row level security;

-- Anyone can read the notes that aren't hidden…
create policy "Visible notes are public"
  on public.office_notes for select
  to anon, authenticated
  using (not hidden);

-- …and leave a short one (it can't be pre-hidden or edited later).
create policy "Anyone can leave a note"
  on public.office_notes for insert
  to anon, authenticated
  with check (not hidden and char_length(body) between 1 and 80 and char_length(name) between 1 and 24);

create index if not exists office_notes_recent on public.office_notes (created_at desc) where not hidden;
