-- What signing up creates.
begin;
select plan(3);

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'lagos@example.test', '{"full_name":"Ada Obi","timezone":"Africa/Lagos"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'bad@example.test', '{"timezone":"Mars/Olympus"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'google@example.test', '{"name":"Kemi Bello"}', now(), now());

select results_eq(
  $$select full_name, timezone from public.profiles where id = 'cccccccc-0000-4000-8000-000000000001'$$,
  $$values ('Ada Obi', 'Africa/Lagos')$$,
  'a new profile takes the name and the browser''s timezone'
);
select is(
  (select timezone from public.profiles where id = 'cccccccc-0000-4000-8000-000000000002'),
  'UTC', 'a timezone the database does not know becomes UTC'
);
select results_eq(
  $$select full_name, timezone from public.profiles where id = 'cccccccc-0000-4000-8000-000000000003'$$,
  $$values ('Kemi Bello', 'UTC')$$,
  'a Google sign-up has a name and starts in UTC'
);

select * from finish();
rollback;
