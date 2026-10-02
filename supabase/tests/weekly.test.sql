-- Every number Insights shows for a week comes from week_stats(). The week under
-- test is 1 to 7 March 2026 for the demo user, who is in Lagos (UTC+1).
begin;
select plan(7);

insert into public.inbox_items (id, user_id, content, status, project_id, created_at, completed_at) values
  -- created 28 Feb 23:30 UTC, which is already 1 March in Lagos: inside the week
  ('aaaaaaaa-0000-4000-8000-000000000001', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'w1', 'completed', '11111111-0000-4000-8000-000000000001', '2026-02-28 23:30+00', '2026-03-03 10:00+00'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'w2', 'completed', '11111111-0000-4000-8000-000000000001', '2026-03-02 09:00+00', '2026-03-04 10:00+00'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'w3', 'completed', '11111111-0000-4000-8000-000000000003', '2026-03-02 09:00+00', '2026-03-05 10:00+00'),
  -- created in the week, completed 7 March 23:30 UTC = 8 March in Lagos: after the week
  ('aaaaaaaa-0000-4000-8000-000000000004', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'w4', 'completed', null, '2026-03-06 09:00+00', '2026-03-07 23:30+00'),
  -- from before the week: one finished during it, one finished after it, one still open
  ('aaaaaaaa-0000-4000-8000-000000000005', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'old-done', 'completed', null, '2026-02-20 09:00+00', '2026-03-02 10:00+00'),
  ('aaaaaaaa-0000-4000-8000-000000000006', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'old-late', 'completed', null, '2026-02-20 09:00+00', '2026-03-20 10:00+00'),
  ('aaaaaaaa-0000-4000-8000-000000000007', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'old-open', 'organized', null, '2026-02-20 09:00+00', null);

insert into public.daily_plans (id, user_id, plan_date) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2026-03-03');
insert into public.daily_plan_items (plan_id, item_id, position) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 1),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 2),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000007', 3);

set local role authenticated;
set local request.jwt.claims = '{"sub":"0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6","role":"authenticated"}';

create temp view w as select * from public.week_stats('2026-03-01', '2026-03-07');

select is((select items_created from w), 4, 'created counts the item captured just after midnight in Lagos');
select is((select items_completed from w), 4, 'completed counts only what was finished before the week ended in Lagos');
select is((select items_carried_over from w), 2,
  'carried over is what was captured before the week and still open when it ended');
select is((select plan_steps from w), 3, 'plan steps are the steps on that week''s plans');
select is((select plan_steps_done from w), 2, 'done steps are those whose item is completed');
select is(
  (select projects from w),
  '[{"name":"Clients","completed":2},{"name":"Home","completed":1}]'::jsonb,
  'completed items are counted per project, most first'
);

select results_eq(
  $$select items_created, items_completed, plan_steps from public.week_stats('2025-01-05', '2025-01-11')$$,
  $$values (0, 0, 0)$$,
  'a week with nothing in it is all zeros'
);

select * from finish();
rollback;
