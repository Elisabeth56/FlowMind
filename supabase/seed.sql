-- Local seed: the demo user. Its data comes from reset_demo(), the same function that
-- puts the hosted demo back every night. Demo login: demo@elisabethnnamani.dev / NBtnS7vPGlkFNP0jvHrG
-- (local only; the hosted demo user has no password and is entered through /auth/demo).


insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values ('00000000-0000-0000-0000-000000000000', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'authenticated', 'authenticated',
  'demo@elisabethnnamani.dev', extensions.crypt('NBtnS7vPGlkFNP0jvHrG', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Tolu Adebayo"}',
  now() - interval '21 days', now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6',
  jsonb_build_object('sub', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'email', 'demo@elisabethnnamani.dev', 'email_verified', true),
  'email', now(), now() - interval '21 days', now());

select public.reset_demo();
