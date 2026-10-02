-- Local seed: one demo account with a realistic week, dated relative to today so the
-- demo never looks stale. Demo login: demo@elisabethnnamani.dev / NBtnS7vPGlkFNP0jvHrG
-- (local only; the hosted demo account gets its own password via DEMO_PASSWORD).


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

-- the signup trigger created the profile; give it a Lagos timezone
update public.profiles set timezone = 'Africa/Lagos', daily_plan_time = '08:30' where id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6';

insert into public.projects (id, user_id, name, color, suggested_by_ai, ai_confidence) values
  ('11111111-0000-4000-8000-000000000001', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Clients',    '#1F3A5F', true, 0.92),
  ('11111111-0000-4000-8000-000000000002', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Pitch prep', '#5E7F6A', true, 0.88),
  ('11111111-0000-4000-8000-000000000003', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Home',       '#F2B27E', true, 0.95),
  ('11111111-0000-4000-8000-000000000004', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Reading',    '#7A5C7E', false, null);

insert into public.inbox_items (user_id, content, item_type, project_id, priority, due_date, status, is_actionable,
  tags, created_at, organized_at, completed_at) values
  -- open
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Call Ada about the invoice before Friday', 'task', '11111111-0000-4000-8000-000000000001', 3, current_date + 1, 'organized', true, '{invoice,ada}', now() - interval '2 hours', now() - interval '2 hours', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Review Kemi''s deck notes before the pitch', 'task', '11111111-0000-4000-8000-000000000002', 3, current_date + 2, 'organized', true, '{deck,pitch}', now() - interval '5 hours', now() - interval '5 hours', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Finish the pitch deck', 'task', '11111111-0000-4000-8000-000000000002', 3, current_date, 'in_progress', true, '{deck}', now() - interval '3 days', now() - interval '3 days', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'idea: send clients a monthly recap email', 'idea', '11111111-0000-4000-8000-000000000001', 1, null, 'organized', false, '{email,clients}', now() - interval '1 day', now() - interval '1 day', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'https://supabase.com/docs/guides/auth/server-side', 'link', '11111111-0000-4000-8000-000000000002', 0, null, 'organized', false, '{supabase,auth}', now() - interval '1 day', now() - interval '1 day', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Buy gas before Sunday', 'task', '11111111-0000-4000-8000-000000000003', 2, current_date + 3, 'organized', true, '{errands}', now() - interval '2 days', now() - interval '2 days', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'notes from the call with Kemi: pricing slide before team, add one customer quote up front', 'note', '11111111-0000-4000-8000-000000000002', 2, null, 'organized', false, '{pitch,feedback}', now() - interval '2 days', now() - interval '2 days', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Ask Tunde if the venue takes card', 'task', null, 2, current_date + 1, 'inbox', true, '{}', now() - interval '10 minutes', null, null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Read: Shape Up, chapters 3 and 4', 'task', '11111111-0000-4000-8000-000000000004', 1, null, 'organized', true, '{reading}', now() - interval '4 days', now() - interval '4 days', null),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Send Kemi the deck Thursday morning so she can rehearse', 'task', '11111111-0000-4000-8000-000000000002', 2, current_date + 2, 'organized', true, '{deck,kemi}', now() - interval '1 day', now() - interval '1 day', null),
  -- done this week
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Book the meeting room', 'task', '11111111-0000-4000-8000-000000000002', 2, current_date, 'completed', true, '{pitch}', now() - interval '1 day', now() - interval '1 day', now() - interval '3 hours'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Send the revised quote to Bisi', 'task', '11111111-0000-4000-8000-000000000001', 3, current_date - 1, 'completed', true, '{quote}', now() - interval '3 days', now() - interval '3 days', now() - interval '1 day'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Fix the broken link on the client site', 'task', '11111111-0000-4000-8000-000000000001', 2, null, 'completed', true, '{site}', now() - interval '4 days', now() - interval '4 days', now() - interval '2 days'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Pay the electricity bill', 'task', '11111111-0000-4000-8000-000000000003', 3, current_date - 2, 'completed', true, '{bills}', now() - interval '5 days', now() - interval '5 days', now() - interval '3 days'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Draft the pitch outline', 'task', '11111111-0000-4000-8000-000000000002', 3, current_date - 2, 'completed', true, '{pitch}', now() - interval '6 days', now() - interval '6 days', now() - interval '4 days'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Collect customer quotes for the deck', 'task', '11111111-0000-4000-8000-000000000002', 2, null, 'completed', true, '{pitch,quotes}', now() - interval '6 days', now() - interval '6 days', now() - interval '5 days'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Renew the domain for the studio site', 'task', '11111111-0000-4000-8000-000000000001', 1, null, 'completed', true, '{admin}', now() - interval '7 days', now() - interval '7 days', now() - interval '5 days'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'Groceries for the week', 'task', '11111111-0000-4000-8000-000000000003', 1, null, 'completed', true, '{errands}', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days');

-- everything already filed has been through the model
update public.inbox_items set ai_status = 'done' where organized_at is not null;

-- today's plan and its steps
insert into public.daily_plans (id, user_id, plan_date, reasoning, energy_recommendation)
values ('22222222-0000-4000-8000-000000000001', '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', current_date,
  'The deck is due at 2pm, so it gets your first block. Two quick client calls fit before lunch; everything else can wait without anything slipping.',
  'Deep work before 11, calls before lunch, and keep the afternoon light after the pitch.');

insert into public.daily_plan_items (plan_id, item_id, position, scheduled_time, duration_minutes, why)
select '22222222-0000-4000-8000-000000000001', i.id, t.position, t.at::time, t.mins, t.why
from public.inbox_items i
join (values
  (1, 'Book the meeting room', '08:30', 10, 'Five minutes now saves a scramble later.'),
  (2, 'Finish the pitch deck', '09:00', 90, 'Due at 2pm, and it needs your sharpest hours.'),
  (3, 'Call Ada about the invoice before Friday', '10:45', 15, 'Quick, and it unblocks Friday''s payment.'),
  (4, 'Ask Tunde if the venue takes card', '11:15', 10, 'The venue needs an answer by tomorrow.')
) as t(position, content, at, mins, why) on t.content = i.content
where i.user_id = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6';

-- last week's reflection
insert into public.weekly_summaries (user_id, week_start, week_end, items_created, items_completed, items_carried_over,
  summary_text, accomplishments, suggestions)
values ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', current_date - 13, current_date - 7, 21, 15, 4,
  'Mornings carried the week: every deep-work block before 11 got done. Friday is where it slipped, with four admin tasks planned and one finished.',
  '["Shipped the client site fixes","Drafted the pitch outline"]',
  '[{"suggestion":"Two 20-minute admin slots on Tuesday and Wednesday instead of one Friday pile","priority":"high","effort":"quick"}]');

-- AI usage this month, so the billing screen and Insights have something real to show
insert into public.ai_runs (user_id, operation, units, model, input_tokens, output_tokens, latency_ms, created_at) values
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize',       6, 'llama-3.1-8b-instant',    1840, 620, 410,  now() - interval '3 hours'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'daily_plan',     1, 'llama-3.3-70b-versatile', 2210, 540, 1280, now() - interval '2 hours'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'organize',       4, 'llama-3.1-8b-instant',    1320, 450, 380,  now() - interval '1 hour'),
  ('0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6', 'ask',            1, 'llama-3.3-70b-versatile', 640,  180, 720,  now() - interval '30 minutes');
