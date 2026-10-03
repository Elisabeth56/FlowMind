-- Deleting an account is deleting its auth user. Everything the user owns must go with it.
begin;
select plan(9);

-- make sure the demo user has a row in every table
insert into public.subscriptions (user_id, tier) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'free')
  on conflict (user_id) do nothing;
insert into public.ai_runs (user_id, operation) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize');
insert into public.payment_transactions (user_id, reference, amount)
  values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'account-test-ref', 500000);
insert into public.weekly_summaries (user_id, week_start, week_end)
  values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2020-01-05', '2020-01-11');
insert into public.daily_plans (id, user_id, plan_date)
  values ('cccccccc-0000-4000-8000-000000000001', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2020-01-06');
insert into public.daily_plan_items (plan_id, item_id, position)
  select 'cccccccc-0000-4000-8000-000000000001', id, 1 from public.inbox_items
  where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6' limit 1;

select ok((select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6') > 0,
  'the account has items before it is deleted');

delete from auth.users where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6';

select is((select count(*) from public.profiles where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'the profile is gone');
select is((select count(*) from public.inbox_items where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'items are gone');
select is((select count(*) from public.projects where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'projects are gone');
select is((select count(*) from public.daily_plans where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'plans are gone');
select is((select count(*) from public.daily_plan_items where plan_id = 'cccccccc-0000-4000-8000-000000000001'), 0::bigint, 'plan steps are gone');
select is((select count(*) from public.weekly_summaries where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'reflections are gone');
select is((select count(*) from public.ai_runs where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'), 0::bigint, 'AI usage is gone');
select is(
  (select count(*) from public.subscriptions where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6')
  + (select count(*) from public.payment_transactions where user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'),
  0::bigint, 'subscription and payment records are gone');

select * from finish();
rollback;
