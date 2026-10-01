# FlowMind architecture

Status: accepted 2026-10-01. Decisions live in `docs/decisions/`.

## What it does

FlowMind is a second brain for people with too many inputs. You dump anything into one inbox (a task, a half-formed idea, a link, a note from a call) and the app does the filing for you.

Core use cases:

1. **Capture.** Type or paste into the inbox from anywhere in the app. Saving never waits on AI.
2. **Organize.** Each new item is classified (task, note, idea, link, reminder), given a priority and due date if it has one, tagged, and filed into a project. You can correct any of it.
3. **Plan today.** "What should I focus on today?" returns an ordered plan built from open items, with a reason for each pick. You tick items off as you go.
4. **Reflect weekly.** A summary of what you planned vs. what you finished, with patterns and a focus for next week. Every number in it is computed, not guessed.
5. **Ask your notes** (ADR 005). Ask a question in plain language and get an answer grounded in your own items, with links back to them.

Plus the SaaS frame: sign up (email or Google), free tier with a monthly AI allowance, Pro via Paystack, export and delete your data.

## Users and scale

Portfolio product, but built to survive real use.

| | Now | 12 months (optimistic) |
|---|---|---|
| Accounts | 7 (test) | 1,000 |
| Weekly active | ~1 | 200 |
| Items per active user per week | — | ~50 |
| Items total | 8 | ~500k at the very top end; ~100k realistic |
| AI calls per active user per day | — | ~10 organize + 1 plan + 0.15 summary + ~3 questions |

Back of envelope at 200 WAU: ~3k AI calls/day, almost all of them small (organize on an 8B model). That is well inside free-tier daily request limits, but **free-tier tokens-per-minute on the larger model is what breaks first**. Daily plans for many users in the same morning hour would queue. Mitigations: small model for everything except planning and summaries, a cross-provider fallback (ADR 004), and per-user rate limits.

Database load is trivial at this scale: one Postgres on the Supabase free tier is enough by two orders of magnitude. Storage: ~2 KB per item plus ~1.5 KB per embedding → under 500 MB at 100k items, inside the free 500 MB only if we stay near the realistic number. Revisit at 50k items.

## Non-functional requirements

- **Latency.** Capture < 150 ms perceived (optimistic insert). Organize lands within ~3 s in the background. Daily plan streams its first content within ~2 s, completes < 15 s. Every AI call has a timeout.
- **Consistency.** Strong for billing and quota (Postgres transactions, idempotent webhooks). Items and plans: read-your-writes for the owner; realtime pushes changes to other open tabs.
- **Availability.** Best effort, single region. If the AI provider is down, capture still works and items wait in an "unorganized" state with a retry.
- **Privacy.** These are people's private notes. Collect the minimum, keep content out of logs, don't send notes to providers that train on free-tier input without saying so, give users export and full delete.
- **Local context.** Users in Nigeria first: Paystack and NGN pricing, WAT as default timezone, mobile-first layouts, pages that work on slow 3G (small JS, no heavy hero video).
- **Budget.** Free tiers everywhere: Supabase free, Vercel Hobby, Groq free, plus one free fallback provider.

## Data model and access patterns

Current schema (live, 7 tables) is captured as a baseline migration first, then changed forward. Proposed shape:

```
profiles          1 ─┐  (identity + preferences only; user-writable)
subscriptions     1 ─┤  (tier, status, Paystack codes; service-role only)
projects          * ─┤
inbox_items       * ─┤── project_id → projects (nullable)
daily_plans       * ─┤   unique (user_id, plan_date)
daily_plan_items  *  │── plan_id → daily_plans, item_id → inbox_items
weekly_summaries  * ─┤   unique (user_id, week_start)
ai_runs           * ─┤  (one row per AI call; quota is a count of these; service-role insert)
payment_events    *  ┘  (Paystack event id unique → idempotent webhooks)
```

| Table | Key columns | Main reads | Writes |
|---|---|---|---|
| `profiles` | full_name, timezone, plan_time, summary_day, preferences jsonb | once per session | user, rarely |
| `subscriptions` | tier, status, plan, next_payment_at, paystack codes | every AI call (quota check) | webhook only |
| `inbox_items` | content, kind, status, priority, due_on, project_id, tags text[], entities jsonb, ai_status, (embedding, fts) | inbox list filtered by status, newest first; open items by priority for planning; items by project | user insert/update; server sets AI fields |
| `projects` | name (unique per user, case-insensitive), color, status, suggested_by_ai | sidebar list; counts via view | user, or AI on organize |
| `daily_plans` | plan_date, focus_theme, reasoning | today's plan by (user, date) | server on generate |
| `daily_plan_items` | position, scheduled_at, duration_min, why_now, completed_at | joined with items for Today | server on generate; user ticks |
| `weekly_summaries` | week_start, computed stats, model text sections | by (user, week_start) | server on generate |
| `ai_runs` | operation, model, provider, prompt_version, tokens in/out, latency, ok, error_code | quota count for the current month; insights | server only |
| `payment_events` | paystack_event_id unique, type, payload | none at runtime | webhook only |

Indexes that matter: `inbox_items (user_id, status, created_at desc)`, `inbox_items (user_id, project_id)`, `ai_runs (user_id, created_at)`, and the two unique constraints above.

What changes from today and why:

- **Billing moves off `profiles`.** Today the "update own profile" policy covers every column, so any signed-in user can set `subscription_tier = 'pro'` from the browser with the public key. Confirmed against the live database.
- **Quota becomes a count of `ai_runs`**, not a counter users can write. The free-tier check is one indexed `count(*)` for the current month in the user's timezone.
- **Plan items get their own table** instead of a jsonb array of ids. Foreign keys guarantee every planned item exists, ticking off an item is a one-row update, and progress is a count instead of a stored number that drifts.
- **Project counts become a view.** The `item_count` / `completed_count` columns and their trigger go; they drift and they are cheap to compute at this scale.
- **Topics become `tags text[]`** with a GIN index so filtering by tag is a real query.
- **Money stays in kobo, integer.**

## Shape of the system

```
Browser (Next.js app, RSC + client islands)
  │  Supabase JS (auth session, RLS-scoped reads, realtime on inbox/projects)
  │  fetch → Next.js route handlers / server actions
  ▼
Next.js on Vercel  ── lib/ai (generate / stream / embed, fallback, timeouts)
  │                         ├─ Groq (primary)
  │                         └─ fallback provider (ADR 004)
  │                  ── Paystack (checkout, webhook)
  ▼
Supabase: Postgres (+ pgvector if ADR 005), Auth, Realtime
```

Flows:

- **Capture → organize.** Client inserts the item directly (RLS), shows it immediately, then calls `POST /api/items/organize` with the id. The handler checks quota, runs one structured-output call, validates it, writes the AI fields and project link in one update, logs an `ai_runs` row. Realtime updates every open tab. Failure leaves `ai_status = 'failed'` with a retry button.
- **Daily plan.** `POST /api/daily-plan` loads open items (SQL does the ranking inputs), streams the plan, validates that every returned item id is one of the candidates, writes `daily_plans` + `daily_plan_items` in one transaction (RPC).
- **Weekly summary.** Stats (created, completed, carried over, completion rate, streaks, top projects) are computed in SQL for the user's week; the model only writes the narrative, patterns and suggestions around those numbers.
- **Billing.** Checkout creates a pending transaction; the webhook (signature-verified, idempotent on event id) is the only writer of `subscriptions`.

## Known risks and how we find out early

| Risk | Early signal |
|---|---|
| Free-tier TPM on the large model during morning planning | Load test 20 concurrent plan generations against Groq; watch 429s |
| Small model mis-files items | Organize eval set (`evals/organize.jsonl`, ~40 cases): kind, priority, project accuracy |
| Model invents item ids or dates in the plan | Plan eval: id validity rate must be 100% after validation; date checks in code |
| Free storage limit if embeddings ship | Track table size in insights; revisit at 50k items |
| Supabase free projects pause after inactivity | Weekly keep-alive cron (Vercel Cron hitting a health route), documented in README |
