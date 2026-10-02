-- The items a daily plan may be built from, ranked by the database so the model is
-- handed the right twenty rather than whichever twenty came first: what is overdue or
-- due today, then priority, then the nearest due date, then the oldest.
-- Runs with the caller's rights and only ever returns the caller's items.
create function public.plan_candidates(p_today date, p_limit integer default 20)
returns table (id uuid, content text, priority integer, due_date date, project_name text)
language sql stable set search_path = '' as $$
  select i.id, i.content, i.priority, i.due_date, p.name
  from public.inbox_items i
  left join public.projects p on p.id = i.project_id
  where i.user_id = (select auth.uid())
    and i.status in ('inbox', 'organized', 'in_progress')
  order by
    (i.due_date is not null and i.due_date <= p_today) desc,
    i.priority desc,
    i.due_date asc nulls last,
    i.created_at asc
  limit p_limit
$$;
revoke execute on function public.plan_candidates(date, integer) from public, anon;
grant execute on function public.plan_candidates(date, integer) to authenticated;
