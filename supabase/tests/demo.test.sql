-- The demo account goes back to the same state every night, whatever visitors did to it,
-- and nothing else is touched.
begin;
select plan(9);

select ok(not has_function_privilege('authenticated', 'public.reset_demo()', 'execute'), 'a signed-in user cannot reset the demo');
select ok(not has_function_privilege('anon', 'public.reset_demo()', 'execute'), 'a visitor cannot reset the demo');

-- another account, which a reset must leave alone
insert into auth.users (instance_id, id, aud, role, email)
values ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'someone@example.com');
insert into public.inbox_items (user_id, content) values ('dddddddd-0000-4000-8000-000000000001', 'mine, not the demo''s');

create temp table before as
select (select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6') as items,
       (select count(*) from public.projects where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6') as projects;

-- a day of visitors
delete from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' and content = 'Finish the pitch deck';
insert into public.inbox_items (user_id, content) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'a visitor was here');
update public.inbox_items set status = 'completed', completed_at = now() where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' and content = 'Buy gas before Sunday';
update public.profiles set full_name = 'Changed', timezone = 'UTC', preferences = '{"theme":"dark"}' where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6';
delete from public.projects where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' and name = 'Reading';

select public.reset_demo();

select is(
  (select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'),
  (select items from before), 'the demo has the same number of items as before');
select is(
  (select count(*) from public.projects where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'),
  (select projects from before), 'and the same projects');
select is((select count(*) from public.inbox_items where content = 'a visitor was here'), 0::bigint, 'what a visitor added is gone');
select is(
  (select status from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' and content = 'Buy gas before Sunday'),
  'organized', 'what a visitor ticked off is open again');
select results_eq(
  $$select full_name, timezone, preferences::text from public.profiles where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'$$,
  $$values ('Tolu Adebayo', 'Africa/Lagos', '{}')$$, 'the profile is put back');
select is(
  (select count(*) from public.daily_plan_items s join public.daily_plans p on p.id = s.plan_id
    where p.user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' and p.plan_date = current_date),
  4::bigint, 'today has its plan again');
select is((select count(*) from public.inbox_items where user_id = 'dddddddd-0000-4000-8000-000000000001'), 1::bigint,
  'another account is not touched');

select * from finish();
rollback;
