-- The moment each cork-board note was left: the weather outside and what
-- Marc was doing, so the board can show the note as a polaroid of it.
-- Run this once in the Supabase SQL editor, after 20261008000000_office_notes.sql.
-- Older notes keep nulls and show a clear sky.
alter table public.office_notes
  add column if not exists weather text
    check (weather in ('clear', 'cloudy', 'rain', 'storm')),
  add column if not exists activity text
    check (activity in ('sleeping', 'coffee', 'working', 'eating', 'gaming', 'coding-late'));
