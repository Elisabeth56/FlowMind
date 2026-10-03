-- Plans, projects and tags: the integrity the schema now guarantees.
begin;
select plan(14);

select is(
  (select count(*) >= 3 from public.inbox_items where tags @> array['pitch']),
  true, 'items can be found by tag'
);

select results_eq(
  $$select item_count::int, completed_count::int from public.project_counts
    where project_id = '11111111-0000-4000-8000-000000000003'$$,
  $$values (9, 2)$$,
  'project counts are computed from the items'
);

select throws_ok(
  $$insert into public.projects (user_id, name) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'clients')$$,
  '23505', null, 'a user cannot have two projects with the same name in different case'
);

select throws_ok(
  $$insert into public.daily_plan_items (plan_id, item_id, position)
    values ('22222222-0000-4000-8000-000000000001', '99999999-0000-4000-8000-000000000000', 9)$$,
  '23503', null, 'a plan cannot reference an item that does not exist'
);

select ok(
  (select count(*) = 3 from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public'
     and tablename in ('inbox_items', 'projects', 'daily_plan_items')),
  'inbox items, projects and plan steps are broadcast in realtime'
);

-- as the signed-in demo user --------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6","role":"authenticated"}';

-- candidates for a plan are ranked by the database
select results_eq(
  $$select content from public.plan_candidates(current_date, 3)$$,
  $$values ('Finish the pitch deck'), ('Call Ada about the invoice before Friday'), ('Review Kemi''s deck notes before the pitch')$$,
  'what is due today comes first, then priority, then the nearest due date'
);
select is(
  (select count(*)::int from public.plan_candidates(current_date) where content = 'Book the meeting room'),
  0, 'completed items are not candidates'
);
select is(
  (select count(*)::int from public.plan_candidates(current_date, 50)
   where content like 'idea:%' or content like 'notes from%' or content like 'https://%'),
  0, 'ideas, notes and links are not scheduled'
);

-- progress is a count over the plan's steps
create temp view progress as
  select count(*)::int as total, (count(*) filter (where i.status = 'completed'))::int as done
  from public.daily_plan_items s join public.inbox_items i on i.id = s.item_id
  where s.plan_id = '22222222-0000-4000-8000-000000000001';

select results_eq('select total, done from progress', $$values (4, 1)$$, 'the seeded plan is one step in');

update public.inbox_items set status = 'completed', completed_at = now() where content = 'Finish the pitch deck';
select results_eq('select total, done from progress', $$values (4, 2)$$, 'ticking a step is one row, and the progress follows');

delete from public.inbox_items where content = 'Ask Tunde if the venue takes card';
select results_eq('select total, done from progress', $$values (3, 2)$$, 'deleting an item takes its step out of the plan');

select throws_ok(
  $$select public.save_daily_plan(current_date, 'r', 'e',
    '[{"item_id":"99999999-0000-4000-8000-000000000000","scheduled_time":"09:00","duration_minutes":30,"why":"x"}]')$$,
  '42501', null, 'saving a plan with an item that is not yours fails'
);
select results_eq('select total from progress', $$values (3)$$, 'and the failed save leaves the existing plan untouched');

select lives_ok(
  $$select public.save_daily_plan(current_date, 'New reasoning', 'New advice',
    (select jsonb_agg(jsonb_build_object('item_id', id, 'scheduled_time', '09:00', 'duration_minutes', 30, 'why', 'first'))
     from public.inbox_items where content = 'Buy gas before Sunday'))$$,
  'regenerating replaces the steps of today''s plan'
);

select * from finish();
rollback;
