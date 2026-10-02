-- Which provider answered and which version of the prompt it was given, on every run.
-- With the fallback in place the model alone no longer says where a call went, and a
-- quality change can only be traced to a prompt edit if the version is recorded.
alter table public.ai_runs
  add column provider text,
  add column prompt_version text;
