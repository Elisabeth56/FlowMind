-- Billing and quota are server-owned: what a signed-in user can and cannot touch.
begin;
select plan(14);

-- quota: counted in the user's timezone, successful runs only -----------------
-- The demo user is in Lagos (UTC+1), so 23:30 UTC on 28 Feb is already 1 March there.
insert into public.ai_runs (user_id, operation, units, success, created_at) values
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize',   5, true,  '2026-02-28 22:59:00+00'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize',   2, true,  '2026-02-28 23:30:00+00'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'daily_plan', 1, true,  '2026-03-04 09:00:00+00'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'daily_plan', 3, false, '2026-03-05 09:00:00+00');

select is(
  public.ai_units_this_month('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2026-02-28 22:59:30+00'),
  5, 'the last minute of February counts February''s runs'
);
select is(
  public.ai_units_this_month('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2026-02-28 23:00:00+00'),
  0, 'the quota resets at midnight on the 1st in the user''s timezone'
);
select is(
  public.ai_units_this_month('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '2026-03-10 12:00:00+00'),
  3, 'units add up across runs, and a failed run costs nothing'
);

-- webhook idempotency ---------------------------------------------------------
insert into public.payment_events (event_key, event_type, payload) values ('k1', 'charge.success', '{}');
select throws_ok(
  $$insert into public.payment_events (event_key, event_type, payload) values ('k1', 'charge.success', '{}')$$,
  '23505', null, 'the same Paystack delivery cannot be recorded twice'
);

-- trigger functions are not callable through the API -------------------------
select ok(not has_function_privilege('anon', 'public.handle_new_user()', 'execute'), 'anon cannot call handle_new_user');
select ok(not has_function_privilege('authenticated', 'public.update_project_counts()', 'execute'), 'users cannot call update_project_counts');

insert into public.subscriptions (user_id, tier) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'free');

-- as the signed-in demo user --------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6","role":"authenticated"}';

select lives_ok(
  $$update public.profiles set full_name = 'Tolu A.', timezone = 'Africa/Lagos' where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'$$,
  'a user can change their own name and timezone'
);
select throws_ok(
  $$update public.profiles set email = 'someone@else.dev' where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'$$,
  '42501', null, 'a user cannot change any other profile column'
);
select is((select tier from public.subscriptions), 'free', 'a user can read their own subscription');
select throws_ok(
  $$update public.subscriptions set tier = 'pro'$$,
  '42501', null, 'a user cannot upgrade themselves'
);
select throws_ok(
  $$insert into public.subscriptions (user_id, tier) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'pro')$$,
  '42501', null, 'a user cannot create a subscription row'
);
select throws_ok(
  $$delete from public.ai_runs$$,
  '42501', null, 'a user cannot erase their usage to reset the quota'
);
select throws_ok(
  $$insert into public.ai_runs (user_id, operation, success) values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize', false)$$,
  '42501', null, 'a user cannot write usage rows'
);
select throws_ok(
  $$select count(*) from public.payment_events$$,
  '42501', null, 'payment events are invisible to users'
);

select * from finish();
rollback;
