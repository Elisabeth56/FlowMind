-- Data model for plans, projects and tags.
--
-- Plan steps were a JSON array of item ids with nothing checking the ids were real,
-- project counts were stored and drifted, topics were JSON that could not be queried,
-- and almost every column was nullable. This migration makes the database say what
-- the app means.

-- nullability ----------------------------------------------------------------
-- Columns that always have a value now say so, which removes a `?? fallback` from
-- every read in the app.
update public.profiles set timezone = 'UTC' where timezone is null;
update public.profiles set daily_plan_time = '08:00' where daily_plan_time is null;
update public.profiles set weekly_summary_day = 0 where weekly_summary_day is null;
update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;
alter table public.profiles
  alter column timezone set not null,
  alter column daily_plan_time set not null,
  alter column weekly_summary_day set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

update public.projects set color = '#6366f1' where color is null;
update public.projects set icon = '📁' where icon is null;
update public.projects set suggested_by_ai = false where suggested_by_ai is null;
update public.projects set status = 'active' where status is null;
update public.projects set created_at = now() where created_at is null;
update public.projects set updated_at = now() where updated_at is null;
alter table public.projects
  alter column color set not null,
  alter column icon set not null,
  alter column suggested_by_ai set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

update public.inbox_items set item_type = 'note' where item_type is null;
update public.inbox_items set priority = 0 where priority is null;
update public.inbox_items set status = 'inbox' where status is null;
update public.inbox_items set is_actionable = false where is_actionable is null;
update public.inbox_items set extracted_entities = '[]' where extracted_entities is null;
update public.inbox_items set created_at = now() where created_at is null;
update public.inbox_items set updated_at = now() where updated_at is null;
alter table public.inbox_items
  alter column item_type set not null,
  alter column priority set not null,
  alter column status set not null,
  alter column is_actionable set not null,
  alter column extracted_entities set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

update public.daily_plans set created_at = now() where created_at is null;
update public.daily_plans set updated_at = now() where updated_at is null;
alter table public.daily_plans
  alter column created_at set not null,
  alter column updated_at set not null;

update public.weekly_summaries set items_created = 0 where items_created is null;
update public.weekly_summaries set items_completed = 0 where items_completed is null;
update public.weekly_summaries set items_carried_over = 0 where items_carried_over is null;
update public.weekly_summaries set accomplishments = '[]' where accomplishments is null;
update public.weekly_summaries set patterns = '[]' where patterns is null;
update public.weekly_summaries set suggestions = '[]' where suggestions is null;
update public.weekly_summaries set created_at = now() where created_at is null;
alter table public.weekly_summaries
  alter column items_created set not null,
  alter column items_completed set not null,
  alter column items_carried_over set not null,
  alter column accomplishments set not null,
  alter column patterns set not null,
  alter column suggestions set not null,
  alter column created_at set not null;

update public.payment_transactions set status = 'pending' where status is null;
update public.payment_transactions set created_at = now() where created_at is null;
alter table public.payment_transactions
  alter column status set not null,
  alter column created_at set not null;

-- inbox_items: tags and AI state ---------------------------------------------
-- Tags replace the extracted_topics JSON so "everything tagged pitch" is an indexed query.
alter table public.inbox_items
  add column tags text[] not null default '{}',
  add column ai_status text not null default 'pending' check (ai_status in ('pending', 'done', 'failed'));

update public.inbox_items i
set tags = coalesce(
  (select array_agg(distinct lower(t)) from jsonb_array_elements_text(i.extracted_topics) t where t <> ''),
  '{}')
where jsonb_typeof(i.extracted_topics) = 'array';

-- anything the model has already organised is done; the rest is still waiting
update public.inbox_items set ai_status = 'done' where organized_at is not null;

alter table public.inbox_items drop column extracted_topics;
create index inbox_items_tags_idx on public.inbox_items using gin (tags);

-- projects: one name per user, counts computed ---------------------------------
-- Fold duplicate names (case-insensitive) into the oldest project before making
-- the name unique.
with ranked as (
  select id, first_value(id) over (partition by user_id, lower(name) order by created_at, id) as keep_id
  from public.projects
)
update public.inbox_items i set project_id = r.keep_id
from ranked r where i.project_id = r.id and r.id <> r.keep_id;

delete from public.projects p using (
  select id, first_value(id) over (partition by user_id, lower(name) order by created_at, id) as keep_id
  from public.projects
) r where p.id = r.id and r.id <> r.keep_id;

create unique index projects_user_name_key on public.projects (user_id, lower(name));

-- The stored counts were kept right by a trigger that missed deletes. They are cheap
-- to compute at this scale, so compute them.
drop trigger update_project_counts_trigger on public.inbox_items;
drop function public.update_project_counts();
alter table public.projects drop column item_count, drop column completed_count;

create view public.project_counts with (security_invoker = true) as
select p.id as project_id,
  count(i.id) as item_count,
  count(i.id) filter (where i.status = 'completed') as completed_count
from public.projects p
left join public.inbox_items i on i.project_id = p.id
group by p.id;

revoke all on public.project_counts from anon, authenticated;
grant select on public.project_counts to authenticated;

-- daily_plan_items -----------------------------------------------------------
-- One row per step of a plan. A step is done when its inbox item is done: there is
-- one place that says whether a task is finished, so the plan and the inbox cannot
-- disagree, and a plan's progress is a count over its steps.
create table public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.daily_plans (id) on delete cascade,
  item_id uuid not null references public.inbox_items (id) on delete cascade,
  position integer not null,
  scheduled_time time,
  duration_minutes integer check (duration_minutes > 0),
  why text,
  created_at timestamptz not null default now(),
  unique (plan_id, item_id)
);
create index daily_plan_items_item_idx on public.daily_plan_items (item_id);

insert into public.daily_plan_items (plan_id, item_id, position, scheduled_time, duration_minutes, why)
select p.id, i.id, e.ord,
  case when e.elem ->> 'scheduled_time' ~ '^([01]?\d|2[0-3]):[0-5]\d$' then (e.elem ->> 'scheduled_time')::time end,
  case when e.elem ->> 'duration_minutes' ~ '^[1-9]\d{0,3}$' then (e.elem ->> 'duration_minutes')::integer end,
  coalesce(e.elem ->> 'why_now', e.elem ->> 'notes')
from public.daily_plans p
cross join lateral jsonb_array_elements(p.plan_items) with ordinality as e(elem, ord)
join public.inbox_items i on i.id::text = e.elem ->> 'item_id' and i.user_id = p.user_id
where jsonb_typeof(p.plan_items) = 'array'
on conflict (plan_id, item_id) do nothing;

alter table public.daily_plans
  drop column plan_items,
  drop column items_total,
  drop column items_completed,
  drop column status;

alter table public.daily_plan_items enable row level security;
revoke all on public.daily_plan_items from anon, authenticated;
grant select, insert, delete on public.daily_plan_items to authenticated;

-- A step belongs to whoever owns its plan, and can only point at their own items.
create policy "Users can view own plan items" on public.daily_plan_items
  for select to authenticated using (
    exists (select 1 from public.daily_plans p where p.id = plan_id and p.user_id = (select auth.uid()))
  );
create policy "Users can add own items to own plans" on public.daily_plan_items
  for insert to authenticated with check (
    exists (select 1 from public.daily_plans p where p.id = plan_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.inbox_items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "Users can remove own plan items" on public.daily_plan_items
  for delete to authenticated using (
    exists (select 1 from public.daily_plans p where p.id = plan_id and p.user_id = (select auth.uid()))
  );

-- Writes a plan and its steps together, so a regenerate can never leave a plan
-- with half its old steps. Runs with the caller's rights; the policies above apply.
create function public.save_daily_plan(
  p_plan_date date,
  p_reasoning text,
  p_energy_recommendation text,
  p_items jsonb
) returns uuid language plpgsql set search_path = '' as $$
declare
  v_plan_id uuid;
begin
  insert into public.daily_plans (user_id, plan_date, reasoning, energy_recommendation)
  values ((select auth.uid()), p_plan_date, p_reasoning, p_energy_recommendation)
  on conflict (user_id, plan_date) do update
    set reasoning = excluded.reasoning,
        energy_recommendation = excluded.energy_recommendation
  returning id into v_plan_id;

  delete from public.daily_plan_items where plan_id = v_plan_id;

  insert into public.daily_plan_items (plan_id, item_id, position, scheduled_time, duration_minutes, why)
  select v_plan_id,
    (e.elem ->> 'item_id')::uuid,
    e.ord,
    (e.elem ->> 'scheduled_time')::time,
    (e.elem ->> 'duration_minutes')::integer,
    e.elem ->> 'why'
  from jsonb_array_elements(p_items) with ordinality as e(elem, ord);

  return v_plan_id;
end;
$$;
revoke execute on function public.save_daily_plan(date, text, text, jsonb) from public, anon;
grant execute on function public.save_daily_plan(date, text, text, jsonb) to authenticated;

-- profiles.preferences -------------------------------------------------------
-- Theme and notification choices. The shape is validated by the app (zod); the
-- database only insists it is an object.
alter table public.profiles
  add column preferences jsonb not null default '{}' check (jsonb_typeof(preferences) = 'object');
grant update (preferences) on public.profiles to authenticated;

-- realtime -------------------------------------------------------------------
-- The app subscribed to these tables, but none was ever in the publication, so no
-- change was ever broadcast.
alter publication supabase_realtime add table public.inbox_items, public.projects, public.daily_plan_items;
