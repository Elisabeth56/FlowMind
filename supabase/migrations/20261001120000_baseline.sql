-- Baseline: the schema as it existed in the live project on 2026-10-01, before any
-- remodel changes. It was created by hand in the dashboard; this file makes it
-- reproducible. Known problems (writable billing columns, drifting counts, no realtime)
-- are fixed by the migrations that follow, not here.

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- profiles -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  subscription_tier text default 'free' check (subscription_tier = any (array['free', 'pro', 'enterprise'])),
  subscription_status text default 'active' check (subscription_status = any (array['active', 'canceled', 'past_due', 'trialing', 'non_renewing'])),
  subscription_plan text check (subscription_plan = any (array['pro_monthly', 'pro_yearly'])),
  subscription_started_at timestamptz,
  subscription_ended_at timestamptz,
  subscription_next_payment timestamptz,
  paystack_customer_code text unique,
  paystack_subscription_code text,
  ai_calls_this_month integer default 0,
  ai_calls_reset_at timestamptz default now(),
  daily_plan_time time default '08:00:00',
  weekly_summary_day integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_profiles_paystack_customer on public.profiles (paystack_customer_code);
create index idx_profiles_paystack_subscription on public.profiles (paystack_subscription_code);

-- projects -------------------------------------------------------------------
create table public.projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  color text default '#6366f1',
  icon text default '📁',
  suggested_by_ai boolean default false,
  ai_confidence double precision check (ai_confidence >= 0 and ai_confidence <= 1),
  status text default 'active' check (status = any (array['active', 'paused', 'completed', 'archived'])),
  item_count integer default 0,
  completed_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_projects_user_id on public.projects (user_id);
create index idx_projects_status on public.projects (status);

-- inbox_items ----------------------------------------------------------------
create table public.inbox_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  item_type text default 'note' check (item_type = any (array['note', 'task', 'idea', 'reminder', 'link'])),
  extracted_entities jsonb default '[]',
  extracted_topics jsonb default '[]',
  sentiment text check (sentiment = any (array['positive', 'neutral', 'negative', 'urgent'])),
  project_id uuid references public.projects (id) on delete set null,
  priority integer default 0 check (priority >= 0 and priority <= 3),
  due_date date,
  status text default 'inbox' check (status = any (array['inbox', 'organized', 'in_progress', 'completed', 'archived'])),
  is_actionable boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  organized_at timestamptz,
  completed_at timestamptz
);
create index idx_inbox_items_user_id on public.inbox_items (user_id);
create index idx_inbox_items_project_id on public.inbox_items (project_id);
create index idx_inbox_items_status on public.inbox_items (status);
create index idx_inbox_items_priority on public.inbox_items (priority desc);
create index idx_inbox_items_created_at on public.inbox_items (created_at desc);

-- daily_plans ----------------------------------------------------------------
create table public.daily_plans (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_date date not null,
  reasoning text,
  energy_recommendation text,
  plan_items jsonb default '[]',
  items_completed integer default 0,
  items_total integer default 0,
  completion_notes text,
  status text default 'active' check (status = any (array['active', 'completed', 'skipped'])),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, plan_date)
);
create index idx_daily_plans_user_date on public.daily_plans (user_id, plan_date desc);

-- weekly_summaries -----------------------------------------------------------
create table public.weekly_summaries (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  items_created integer default 0,
  items_completed integer default 0,
  items_carried_over integer default 0,
  summary_text text,
  accomplishments jsonb default '[]',
  patterns jsonb default '[]',
  suggestions jsonb default '[]',
  productivity_trend text check (productivity_trend = any (array['improving', 'stable', 'declining'])),
  focus_score integer check (focus_score >= 0 and focus_score <= 100),
  created_at timestamptz default now(),
  unique (user_id, week_start)
);
create index idx_weekly_summaries_user_week on public.weekly_summaries (user_id, week_start desc);

-- ai_processing_log ----------------------------------------------------------
create table public.ai_processing_log (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation_type text not null check (operation_type = any (array['organize', 'daily_plan', 'weekly_summary', 'extract_entities'])),
  input_tokens integer,
  output_tokens integer,
  model_used text,
  latency_ms integer,
  success boolean default true,
  error_message text,
  created_at timestamptz default now()
);
create index idx_ai_log_user_id on public.ai_processing_log (user_id);
create index idx_ai_log_created_at on public.ai_processing_log (created_at desc);

-- payment_transactions -------------------------------------------------------
create table public.payment_transactions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reference text not null unique,
  paystack_transaction_id integer,
  amount integer not null,
  plan_type text check (plan_type = any (array['pro_monthly', 'pro_yearly'])),
  status text default 'pending' check (status = any (array['pending', 'success', 'failed', 'abandoned'])),
  created_at timestamptz default now(),
  verified_at timestamptz
);
create index idx_payment_transactions_user_id on public.payment_transactions (user_id);
create index idx_payment_transactions_reference on public.payment_transactions (reference);

-- functions and triggers -----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_project_counts()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id and old.project_id is not null then
    update public.projects set
      item_count = (select count(*) from public.inbox_items where project_id = old.project_id),
      completed_count = (select count(*) from public.inbox_items where project_id = old.project_id and status = 'completed')
    where id = old.project_id;
  end if;
  if new.project_id is not null then
    update public.projects set
      item_count = (select count(*) from public.inbox_items where project_id = new.project_id),
      completed_count = (select count(*) from public.inbox_items where project_id = new.project_id and status = 'completed')
    where id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_projects_updated_at before update on public.projects
  for each row execute function public.update_updated_at();
create trigger update_inbox_items_updated_at before update on public.inbox_items
  for each row execute function public.update_updated_at();
create trigger update_daily_plans_updated_at before update on public.daily_plans
  for each row execute function public.update_updated_at();
create trigger update_project_counts_trigger after insert or update on public.inbox_items
  for each row execute function public.update_project_counts();

-- row level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.inbox_items enable row level security;
alter table public.daily_plans enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.ai_processing_log enable row level security;
alter table public.payment_transactions enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can create own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);

create policy "Users can view own inbox items" on public.inbox_items for select using (auth.uid() = user_id);
create policy "Users can create own inbox items" on public.inbox_items for insert with check (auth.uid() = user_id);
create policy "Users can update own inbox items" on public.inbox_items for update using (auth.uid() = user_id);
create policy "Users can delete own inbox items" on public.inbox_items for delete using (auth.uid() = user_id);

create policy "Users can view own daily plans" on public.daily_plans for select using (auth.uid() = user_id);
create policy "Users can create own daily plans" on public.daily_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own daily plans" on public.daily_plans for update using (auth.uid() = user_id);

create policy "Users can view own weekly summaries" on public.weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can create own weekly summaries" on public.weekly_summaries for insert with check (auth.uid() = user_id);

create policy "Users can view own AI logs" on public.ai_processing_log for select using (auth.uid() = user_id);

create policy "Users can view own transactions" on public.payment_transactions for select using (auth.uid() = user_id);
