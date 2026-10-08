-- The desk gained a "resting" activity (an evening with the cats), so a
-- note's moment can now record it. Run after 20261009000000_office_notes_moment.sql.
alter table public.office_notes drop constraint if exists office_notes_activity_check;
alter table public.office_notes
  add constraint office_notes_activity_check
  check (activity in ('sleeping', 'coffee', 'working', 'eating', 'gaming', 'resting', 'coding-late'));
