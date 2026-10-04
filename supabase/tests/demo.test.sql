-- Demo accounts: each visitor gets the same seeded week in an account of their own,
-- and only demo accounts older than a day are deleted.
begin;
select plan(11);

select ok(not has_function_privilege('authenticated', 'public.seed_demo(uuid)', 'execute'), 'a signed-in user cannot seed an account');
select ok(not has_function_privilege('authenticated', 'public.purge_demo_users()', 'execute'), 'a signed-in user cannot delete demo accounts');
select ok(not has_function_privilege('authenticated', 'public.demo_usage()', 'execute'), 'a signed-in user cannot read demo usage');

-- two demo visitors (one from yesterday, one from just now) and one real account
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, created_at) values
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'demo-old@example.com', '{"demo":true}', now() - interval '25 hours'),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'demo-new@example.com', '{"demo":true}', now()),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'real@example.com', '{}', now() - interval '30 days');
insert into public.inbox_items (user_id, content) values ('dddddddd-0000-4000-8000-000000000003', 'a real person''s note');

select public.seed_demo('dddddddd-0000-4000-8000-000000000001');
select public.seed_demo('dddddddd-0000-4000-8000-000000000002');

select is(
  (select count(*) from public.inbox_items where user_id = 'dddddddd-0000-4000-8000-000000000002'),
  (select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'),
  'a visitor''s account holds the same items as the seeded one');
select is(
  (select count(*) from public.daily_plan_items s join public.daily_plans p on p.id = s.plan_id
    where p.user_id = 'dddddddd-0000-4000-8000-000000000002' and p.plan_date = current_date),
  4::bigint, 'with a plan for today');
select is(
  (select count(*) from public.inbox_items i join public.projects p on p.id = i.project_id
    where i.user_id = 'dddddddd-0000-4000-8000-000000000002' and p.user_id <> i.user_id),
  0::bigint, 'and its items point only at its own projects');
select is(
  (select tier from public.subscriptions where user_id = 'dddddddd-0000-4000-8000-000000000002'), 'pro',
  'a demo account is on Pro');

-- seeding again puts an account back, whatever was done to it
delete from public.inbox_items where user_id = 'dddddddd-0000-4000-8000-000000000002' and content = 'Finish the pitch deck';
insert into public.inbox_items (user_id, content) values ('dddddddd-0000-4000-8000-000000000002', 'added by the visitor');
select public.seed_demo('dddddddd-0000-4000-8000-000000000002');
select is(
  (select count(*) from public.inbox_items where user_id = 'dddddddd-0000-4000-8000-000000000002'),
  (select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'),
  'seeding an account again restores it');

select is((select accounts from public.demo_usage()), 2, 'demo usage counts demo accounts only');

select is(public.purge_demo_users(), 1, 'the cleanup removes the demo account older than a day');
select results_eq(
  $$select id from auth.users where id::text like 'dddddddd-%' order by id$$,
  $$values ('dddddddd-0000-4000-8000-000000000002'::uuid), ('dddddddd-0000-4000-8000-000000000003'::uuid)$$,
  'today''s demo account and the real account are still there');

select * from finish();
rollback;
