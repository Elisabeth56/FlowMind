-- Weekly reflection: the numbers come from the database, the words from the model.
--
-- The model used to invent a "focus score" and a trend. Those are replaced by a plan
-- completion rate and a trend computed from counts, and its free-form patterns and
-- suggestions by one thing to keep and one thing to try.
alter table public.weekly_summaries
  drop column focus_score,
  drop column patterns,
  drop column suggestions,
  add column plan_completion_rate integer check (plan_completion_rate between 0 and 100),
  add column project_counts jsonb not null default '[]',
  add column keep text,
  add column try_next text;

-- Everything Insights shows as a number for one week, in the caller's timezone:
-- a week starts at their midnight, not UTC's. Runs with the caller's rights.
--   items_created       captured during the week
--   items_completed     completed during the week
--   items_carried_over  captured before the week and still open when it ended
--   plan_steps / plan_steps_done   steps on that week's daily plans, and how many are done
--   projects            completed items per project, most first
create function public.week_stats(p_week_start date, p_week_end date)
returns table (
  items_created integer,
  items_completed integer,
  items_carried_over integer,
  plan_steps integer,
  plan_steps_done integer,
  projects jsonb
)
language sql stable set search_path = '' as $$
  with me as (
    select p.id,
      coalesce((select n.name from pg_catalog.pg_timezone_names n where n.name = p.timezone), 'UTC') as tz
    from public.profiles p
    where p.id = (select auth.uid())
  ),
  week as (
    select me.id as user_id,
      p_week_start::timestamp at time zone me.tz as starts_at,
      (p_week_end + 1)::timestamp at time zone me.tz as ends_at
    from me
  ),
  done as (
    select i.id, i.project_id
    from public.inbox_items i, week w
    where i.user_id = w.user_id and i.status = 'completed'
      and i.completed_at >= w.starts_at and i.completed_at < w.ends_at
  ),
  steps as (
    select i.status
    from public.daily_plans d
    join public.daily_plan_items s on s.plan_id = d.id
    join public.inbox_items i on i.id = s.item_id
    where d.user_id = (select auth.uid()) and d.plan_date between p_week_start and p_week_end
  )
  select
    (select count(*) from public.inbox_items i, week w
      where i.user_id = w.user_id and i.created_at >= w.starts_at and i.created_at < w.ends_at)::integer,
    (select count(*) from done)::integer,
    (select count(*) from public.inbox_items i, week w
      where i.user_id = w.user_id and i.created_at < w.starts_at
        and (i.status in ('inbox', 'organized', 'in_progress')
             or (i.status = 'completed' and i.completed_at >= w.ends_at)))::integer,
    (select count(*) from steps)::integer,
    (select count(*) from steps where status = 'completed')::integer,
    coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'completed', c.completed) order by c.completed desc, c.name)
      from (
        select p.name, count(*) as completed
        from done join public.projects p on p.id = done.project_id
        group by p.name
      ) c
    ), '[]'::jsonb)
$$;
revoke execute on function public.week_stats(date, date) from public, anon;
grant execute on function public.week_stats(date, date) to authenticated;
