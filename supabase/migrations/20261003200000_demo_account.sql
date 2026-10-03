-- The demo: every visitor who clicks "Try the demo" gets a private account filled with
-- the same realistic week, and the account is deleted a day later.
--
-- seed_demo() is the single definition of that week. The local seed calls it for the
-- local demo user, /auth/demo calls it for each visitor's new account. Dates are relative
-- to today, so the week never looks stale. Demo accounts are marked in auth.users
-- (app metadata {"demo": true}), which a user cannot edit.
--
-- All three functions are for the service role only.
create function public.seed_demo(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $demo$
declare
  demo constant uuid := p_user;
  -- The local seed user keeps fixed project ids, which the database tests refer to
  fixed constant boolean := p_user = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6';
  v_clients constant uuid := case when fixed then '11111111-0000-4000-8000-000000000001' else gen_random_uuid() end;
  v_pitch constant uuid := case when fixed then '11111111-0000-4000-8000-000000000002' else gen_random_uuid() end;
  v_home constant uuid := case when fixed then '11111111-0000-4000-8000-000000000003' else gen_random_uuid() end;
  v_reading constant uuid := case when fixed then '11111111-0000-4000-8000-000000000004' else gen_random_uuid() end;
  v_plan constant uuid := gen_random_uuid();
begin
  if not exists (select 1 from public.profiles where id = demo) then
    raise exception 'No such user';
  end if;

  -- items take their plan steps and embeddings with them
  delete from public.daily_plans where user_id = demo;
  delete from public.inbox_items where user_id = demo;
  delete from public.projects where user_id = demo;
  delete from public.weekly_summaries where user_id = demo;
  delete from public.ai_runs where user_id = demo;
  delete from public.subscriptions where user_id = demo;

  -- on Pro so every feature can be tried; AI use is capped per day in the app (src/lib/demo.ts)
  insert into public.subscriptions (user_id, tier, status, plan, started_at)
  values (demo, 'pro', 'active', 'pro_monthly', now() - interval '21 days');

  -- the person whose week this is
  update public.profiles
  set full_name = 'Tolu Adebayo', timezone = 'Africa/Lagos', daily_plan_time = '08:30',
      weekly_summary_day = 0, preferences = '{}'
  where id = demo;

  insert into public.projects (id, user_id, name, color, suggested_by_ai, ai_confidence) values
  (v_clients, demo, 'Clients',    '#1F3A5F', true, 0.92),
  (v_pitch, demo, 'Pitch prep', '#5E7F6A', true, 0.88),
  (v_home, demo, 'Home',       '#F2B27E', true, 0.95),
  (v_reading, demo, 'Reading',    '#7A5C7E', false, null);

  insert into public.inbox_items (user_id, content, item_type, project_id, priority, due_date, status, is_actionable,
  tags, created_at, organized_at, completed_at) values
  -- open
  (demo, 'Call Ada about the invoice before Friday', 'task', v_clients, 3, current_date + 1, 'organized', true, '{invoice,ada}', now() - interval '2 hours', now() - interval '2 hours', null),
  (demo, 'Review Kemi''s deck notes before the pitch', 'task', v_pitch, 3, current_date + 2, 'organized', true, '{deck,pitch}', now() - interval '5 hours', now() - interval '5 hours', null),
  (demo, 'Finish the pitch deck', 'task', v_pitch, 3, current_date, 'in_progress', true, '{deck}', now() - interval '3 days', now() - interval '3 days', null),
  (demo, 'idea: send clients a monthly recap email', 'idea', v_clients, 1, null, 'organized', false, '{email,clients}', now() - interval '1 day', now() - interval '1 day', null),
  (demo, 'https://supabase.com/docs/guides/auth/server-side', 'link', v_pitch, 0, null, 'organized', false, '{supabase,auth}', now() - interval '1 day', now() - interval '1 day', null),
  (demo, 'Buy gas before Sunday', 'task', v_home, 2, current_date + 3, 'organized', true, '{errands}', now() - interval '2 days', now() - interval '2 days', null),
  (demo, 'notes from the call with Kemi: pricing slide before team, add one customer quote up front', 'note', v_pitch, 2, null, 'organized', false, '{pitch,feedback}', now() - interval '2 days', now() - interval '2 days', null),
  (demo, 'Ask Tunde if the venue takes card', 'task', null, 2, current_date + 1, 'inbox', true, '{}', now() - interval '10 minutes', null, null),
  (demo, 'Read: Shape Up, chapters 3 and 4', 'task', v_reading, 1, null, 'organized', true, '{reading}', now() - interval '4 days', now() - interval '4 days', null),
  (demo, 'Send Kemi the deck Thursday morning so she can rehearse', 'task', v_pitch, 2, current_date + 2, 'organized', true, '{deck,kemi}', now() - interval '1 day', now() - interval '1 day', null),
  -- done this week
  (demo, 'Book the meeting room', 'task', v_pitch, 2, current_date, 'completed', true, '{pitch}', now() - interval '1 day', now() - interval '1 day', now() - interval '3 hours'),
  (demo, 'Send the revised quote to Bisi', 'task', v_clients, 3, current_date - 1, 'completed', true, '{quote}', now() - interval '3 days', now() - interval '3 days', now() - interval '1 day'),
  (demo, 'Fix the broken link on the client site', 'task', v_clients, 2, null, 'completed', true, '{site}', now() - interval '4 days', now() - interval '4 days', now() - interval '2 days'),
  (demo, 'Pay the electricity bill', 'task', v_home, 3, current_date - 2, 'completed', true, '{bills}', now() - interval '5 days', now() - interval '5 days', now() - interval '3 days'),
  (demo, 'Draft the pitch outline', 'task', v_pitch, 3, current_date - 2, 'completed', true, '{pitch}', now() - interval '6 days', now() - interval '6 days', now() - interval '4 days'),
  (demo, 'Collect customer quotes for the deck', 'task', v_pitch, 2, null, 'completed', true, '{pitch,quotes}', now() - interval '6 days', now() - interval '6 days', now() - interval '5 days'),
  (demo, 'Renew the domain for the studio site', 'task', v_clients, 1, null, 'completed', true, '{admin}', now() - interval '7 days', now() - interval '7 days', now() - interval '5 days'),
  (demo, 'Groceries for the week', 'task', v_home, 1, null, 'completed', true, '{errands}', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days');

  -- older notes, ideas and links: what Ask your notes answers from (evals/ask.jsonl asks about these)
  insert into public.inbox_items (user_id, content, item_type, project_id, priority, due_date, status, is_actionable,
  tags, created_at, organized_at, completed_at) values
  (demo, 'Bisi''s quote: 450k for the redesign, half upfront, the rest on launch', 'note', v_clients, 0, null, 'organized', false, '{quote,bisi}', now() - interval '9 days', now() - interval '9 days', null),
  (demo, 'Ada pays invoices on the last Friday of the month, send them by Wednesday', 'note', v_clients, 0, null, 'organized', false, '{invoice,ada}', now() - interval '21 days', now() - interval '21 days', null),
  (demo, 'Client site hosting moves to Vercel in November, DNS is still on Namecheap', 'note', v_clients, 0, null, 'organized', false, '{hosting}', now() - interval '12 days', now() - interval '12 days', null),
  (demo, 'Chidi wants the dashboard in dark mode and an export to CSV', 'note', v_clients, 0, null, 'organized', false, '{chidi,dashboard}', now() - interval '16 days', now() - interval '16 days', null),
  (demo, 'Retainer with Ngozi: 10 hours a month, unused hours do not roll over', 'note', v_clients, 0, null, 'organized', false, '{retainer,ngozi}', now() - interval '33 days', now() - interval '33 days', null),
  (demo, 'idea: offer a fixed-price website audit as a first project for new clients', 'idea', v_clients, 0, null, 'organized', false, '{offer}', now() - interval '27 days', now() - interval '27 days', null),
  (demo, 'https://stripe.com/docs/payments/checkout how checkout sessions work, for Chidi''s shop', 'link', v_clients, 0, null, 'organized', false, '{stripe,payments}', now() - interval '15 days', now() - interval '15 days', null),
  (demo, 'Bisi prefers WhatsApp over email, never call before 10am', 'note', v_clients, 0, null, 'organized', false, '{bisi}', now() - interval '40 days', now() - interval '40 days', null),
  (demo, 'Pitch is Friday 2pm at the Co-Creation Hub, fourth floor', 'note', v_pitch, 0, null, 'organized', false, '{pitch}', now() - interval '8 days', now() - interval '8 days', null),
  (demo, 'Investor question to prepare for: how do you get the first 100 customers', 'note', v_pitch, 0, null, 'organized', false, '{pitch,investors}', now() - interval '10 days', now() - interval '10 days', null),
  (demo, 'Traction numbers for the deck: 38 paying customers, 12 percent monthly growth', 'note', v_pitch, 0, null, 'organized', false, '{deck,traction}', now() - interval '11 days', now() - interval '11 days', null),
  (demo, 'Kemi says keep the deck to ten slides and end on the ask', 'note', v_pitch, 0, null, 'organized', false, '{deck,kemi}', now() - interval '13 days', now() - interval '13 days', null),
  (demo, 'The ask: 15 million naira for 18 months of runway', 'note', v_pitch, 0, null, 'organized', false, '{pitch,funding}', now() - interval '14 days', now() - interval '14 days', null),
  (demo, 'idea: open the pitch with the story of the missed delivery', 'idea', v_pitch, 0, null, 'organized', false, '{pitch}', now() - interval '9 days', now() - interval '9 days', null),
  (demo, 'https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck', 'link', v_pitch, 0, null, 'organized', false, '{deck}', now() - interval '18 days', now() - interval '18 days', null),
  (demo, 'Landlord: rent goes up to 1.8 million from January, renewal letter due in November', 'note', v_home, 0, null, 'organized', false, '{rent}', now() - interval '19 days', now() - interval '19 days', null),
  (demo, 'Generator service is every three months, last done in August', 'note', v_home, 0, null, 'organized', false, '{generator}', now() - interval '44 days', now() - interval '44 days', null),
  (demo, 'Mum''s birthday is 14 November, she wants the blue wrapper from Balogun market', 'note', v_home, 0, null, 'organized', false, '{family}', now() - interval '23 days', now() - interval '23 days', null),
  (demo, 'Plumber Sunday fixed the kitchen tap, his number is in the building WhatsApp group', 'note', v_home, 0, null, 'organized', false, '{repairs}', now() - interval '30 days', now() - interval '30 days', null),
  (demo, 'Gym membership renews on the 5th, cancel before then if I am not going', 'note', v_home, 0, null, 'organized', false, '{gym}', now() - interval '26 days', now() - interval '26 days', null),
  (demo, 'idea: batch cook on Sundays so weekday lunches are sorted', 'idea', v_home, 0, null, 'organized', false, '{food}', now() - interval '35 days', now() - interval '35 days', null),
  (demo, 'Shape Up: appetite means deciding how much time an idea is worth before designing it', 'note', v_reading, 0, null, 'organized', false, '{shapeup}', now() - interval '17 days', now() - interval '17 days', null),
  (demo, 'From Deep Work: schedule every minute of the day, then revise the schedule when it breaks', 'note', v_reading, 0, null, 'organized', false, '{deepwork}', now() - interval '38 days', now() - interval '38 days', null),
  (demo, 'Book to read next: The Mom Test, recommended by Kemi for customer interviews', 'note', v_reading, 0, null, 'organized', false, '{books}', now() - interval '22 days', now() - interval '22 days', null),
  (demo, 'https://basecamp.com/shapeup', 'link', v_reading, 0, null, 'organized', false, '{shapeup}', now() - interval '20 days', now() - interval '20 days', null),
  (demo, 'Tunde''s venue holds 150 people and wants a 30 percent deposit', 'note', null, 0, null, 'organized', false, '{venue,tunde}', now() - interval '8 days', now() - interval '8 days', null),
  (demo, 'Flight to Abuja on the 22nd, 7am from the local wing, book a cab the night before', 'note', null, 0, null, 'organized', false, '{travel}', now() - interval '9 days', now() - interval '9 days', null),
  (demo, 'Dentist said to come back in six months, that makes it March', 'note', null, 0, null, 'organized', false, '{appointments}', now() - interval '25 days', now() - interval '25 days', null),
  (demo, 'Passport expires next June, renewal takes about six weeks', 'note', null, 0, null, 'organized', false, '{documents}', now() - interval '31 days', now() - interval '31 days', null),
  (demo, 'Wifi password for the studio is on the sticky note under the router', 'note', null, 0, null, 'organized', false, '{studio}', now() - interval '42 days', now() - interval '42 days', null);

  -- everything already filed has been through the model
  update public.inbox_items set ai_status = 'done' where user_id = demo and organized_at is not null;

  -- today's plan and its steps
  insert into public.daily_plans (id, user_id, plan_date, reasoning, energy_recommendation)
  values (v_plan, demo, current_date,
  'The deck is due at 2pm, so it gets your first block. Two quick client calls fit before lunch; everything else can wait without anything slipping.',
  'Deep work before 11, calls before lunch, and keep the afternoon light after the pitch.');

  insert into public.daily_plan_items (plan_id, item_id, position, scheduled_time, duration_minutes, why)
  select v_plan, i.id, t.position, t.at::time, t.mins, t.why
  from public.inbox_items i
  join (values
  (1, 'Book the meeting room', '08:30', 10, 'Five minutes now saves a scramble later.'),
  (2, 'Finish the pitch deck', '09:00', 90, 'Due at 2pm, and it needs your sharpest hours.'),
  (3, 'Call Ada about the invoice before Friday', '10:45', 15, 'Quick, and it unblocks Friday''s payment.'),
  (4, 'Ask Tunde if the venue takes card', '11:15', 10, 'The venue needs an answer by tomorrow.')
  ) as t(position, content, at, mins, why) on t.content = i.content
  where i.user_id = demo;

  -- last week's reflection
  insert into public.weekly_summaries (user_id, week_start, week_end, items_created, items_completed, items_carried_over,
  plan_completion_rate, productivity_trend, project_counts, summary_text, accomplishments, keep, try_next)
  values (demo, current_date - 13, current_date - 7, 21, 15, 4,
  74, 'improving', '[{"name":"Clients","completed":7},{"name":"Pitch prep","completed":5},{"name":"Home","completed":3}]',
  'Mornings carried the week: every deep-work block before 11 got done. Friday is where it slipped, with four admin tasks planned and one finished.',
  '["Shipped the client site fixes","Drafted the pitch outline"]',
  'Deep work before 11. Every morning block you planned got done.',
  'Two 20-minute admin slots on Tuesday and Wednesday instead of one Friday pile.');

  -- AI usage this month, so the billing screen and Insights have something real to show
  insert into public.ai_runs (user_id, operation, units, provider, model, prompt_version, input_tokens, output_tokens, latency_ms, created_at) values
  (demo, 'organize',       6, 'groq', 'openai/gpt-oss-20b', 'organize-2',  1840, 620, 410,  now() - interval '3 hours'),
  (demo, 'daily_plan',     1, 'groq', 'openai/gpt-oss-120b', 'daily-plan-2', 2210, 540, 1280, now() - interval '2 hours'),
  (demo, 'organize',       4, 'groq', 'openai/gpt-oss-20b', 'organize-2',  1320, 450, 380,  now() - interval '1 hour'),
  (demo, 'ask',            1, 'groq', 'openai/gpt-oss-120b', 'ask-2', 640,  180, 720,  now() - interval '30 minutes');
end;
$demo$;
revoke execute on function public.seed_demo(uuid) from public, anon, authenticated;
grant execute on function public.seed_demo(uuid) to service_role;

-- Deletes demo accounts older than a day; everything they own goes with them. Run nightly.
create function public.purge_demo_users()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  removed integer;
begin
  delete from auth.users
  where raw_app_meta_data ->> 'demo' = 'true' and created_at < now() - interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke execute on function public.purge_demo_users() from public, anon, authenticated;
grant execute on function public.purge_demo_users() to service_role;

-- How many demo accounts exist and how many AI units they have used in the last day,
-- across all of them: the two numbers the app caps, since every demo shares one model key.
create function public.demo_usage()
returns table (accounts integer, ai_units_today integer)
language sql stable security definer set search_path = '' as $$
  select
    (select count(*) from auth.users u where u.raw_app_meta_data ->> 'demo' = 'true')::integer,
    (select coalesce(sum(r.units), 0)
       from public.ai_runs r
       join auth.users u on u.id = r.user_id
      where u.raw_app_meta_data ->> 'demo' = 'true' and r.success and r.created_at > now() - interval '1 day')::integer
$$;
revoke execute on function public.demo_usage() from public, anon, authenticated;
grant execute on function public.demo_usage() to service_role;
