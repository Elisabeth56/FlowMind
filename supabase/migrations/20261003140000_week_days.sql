-- Planned against done for each day of a week: the chart on Insights.
--
-- A day's "planned" is the steps on that day's plan and its "done" is how many of
-- those steps' items are completed, so the seven days add up to week_stats()'s
-- plan_steps and plan_steps_done. Days without a plan come back as zeros, so the
-- chart always has seven columns. Runs with the caller's rights.
create function public.week_days(p_week_start date, p_week_end date)
returns table (day date, planned integer, done integer)
language sql stable set search_path = '' as $$
  select d.day::date,
    count(s.id)::integer,
    (count(s.id) filter (where i.status = 'completed'))::integer
  from generate_series(p_week_start::timestamp, p_week_end::timestamp, interval '1 day') as d(day)
  left join public.daily_plans p on p.plan_date = d.day::date and p.user_id = (select auth.uid())
  left join public.daily_plan_items s on s.plan_id = p.id
  left join public.inbox_items i on i.id = s.item_id
  group by d.day
  order by d.day
$$;
revoke execute on function public.week_days(date, date) from public, anon;
grant execute on function public.week_days(date, date) to authenticated;
