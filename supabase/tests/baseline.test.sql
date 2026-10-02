-- Runs in CI after every migration and the seed have been applied to a fresh database.
begin;
select plan(6);

select ok(
  (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'),
  'every public table has row level security on'
);

select is(
  (select count(*)::int from public.profiles where email = 'demo@elisabethnnamani.dev'),
  1, 'signing up the demo user created its profile'
);

select is(
  (select timezone from public.profiles where email = 'demo@elisabethnnamani.dev'),
  'Africa/Lagos', 'demo profile uses Lagos time'
);

select ok(
  (select count(*) from public.inbox_items i join public.profiles p on p.id = i.user_id
   where p.email = 'demo@elisabethnnamani.dev') >= 15,
  'demo account has a realistic inbox'
);

select is(
  (select count(*)::int from public.daily_plan_items s
     join public.daily_plans d on d.id = s.plan_id
     join public.profiles p on p.id = d.user_id
   where p.email = 'demo@elisabethnnamani.dev' and d.plan_date = current_date),
  4, 'demo account has a plan for today with four steps'
);

-- another user sees none of the demo user's data
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated"}';
select is((select count(*)::int from public.inbox_items), 0, 'a different user cannot read the demo inbox');

select * from finish();
rollback;
