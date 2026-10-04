-- A daily plan schedules things to do. Notes, ideas and links stay in the inbox;
-- they were being offered to the planner (and to the rule-based fallback, which
-- scheduled them). An item the AI has not filed yet is still offered, since nobody
-- knows what it is.
create or replace function public.plan_candidates(p_today date, p_limit integer default 20)
returns table (id uuid, content text, priority integer, due_date date, project_name text)
language sql stable set search_path = '' as $$
  select i.id, i.content, i.priority, i.due_date, p.name
  from public.inbox_items i
  left join public.projects p on p.id = i.project_id
  where i.user_id = (select auth.uid())
    and i.status in ('inbox', 'organized', 'in_progress')
    and (i.is_actionable or i.item_type in ('task', 'reminder') or i.ai_status = 'pending')
  order by
    (i.due_date is not null and i.due_date <= p_today) desc,
    i.priority desc,
    i.due_date asc nulls last,
    i.created_at asc
  limit p_limit
$$;
