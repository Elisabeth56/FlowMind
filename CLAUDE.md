# FlowMind

## Commits

Never add AI attribution to anything in this repo. No `Co-Authored-By: Claude`
trailer, no `Claude-Session:` line, no "Generated with Claude Code" footer — in
commit messages, pull request descriptions, code comments, or anywhere else.

Commit as the repository owner:

```
git config user.name "Elisabeth56"
git config user.email "nnamanielisabeth@gmail.com"
```

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase · Vercel AI SDK (Groq,
Gemini fallback) · Paystack.

## Layout

- `src/app/` — routes. `/` is the marketing site, `/dash/*` the signed-in app,
  `/api/*` the route handlers.
- `src/components/landing/` — the marketing page (its motion is in `landing.css`, scoped
  to `.lp`); `src/components/ui/` — the design system's base components. In-app UI lives
  beside its route.
- `src/middleware.ts` — refreshes the session and guards `/dash`. It must live in `src/`:
  at the repo root Next ignores it without any warning.
- `src/app/dash/AppProvider.tsx` — what every app screen shares (items, projects, usage,
  capture, undo toast, palette); screens read it with `useApp()`. `shell/` is the sidebar,
  tab bar, command palette and toast.
- `src/hooks/` — client data hooks (`useAuth`, `useInboxItems`, `useProjects`,
  `useAI`, `useSubscription`).
- `src/lib/` — `env.ts` (validated env), `ai/` (model client, features, prompts), `supabase/`, `paystack/`, `plans.ts`.
- `src/types/database.ts` — generated from the migrations (`npm run db:types`); never edit
  by hand. App-level row names (`Profile`, `InboxItem`…) live in `src/types/models.ts`.
- `supabase/` — `migrations/` (the schema, in order), `seed.sql` (demo account and a
  realistic week), `tests/` (pgTAP, run in CI with `supabase test db`).

## Conventions

- **Read env through `src/lib/env.ts`.** `publicEnv()` for `NEXT_PUBLIC_*`, `serverEnv()`
  for secrets, always inside a function (never at module scope, which runs during
  `next build`). Add new variables to the schema and to `.env.example`.
- **Pricing lives in `src/lib/plans.ts`.** The marketing page, the in-app billing
  screen and the Paystack checkout route all read from it. Never hardcode an
  amount anywhere else.
- **All model calls go through `src/lib/ai/index.ts`** (`generate()` for zod-validated
  output, `stream()` for text): Groq first, Gemini as fallback, a timeout, and an `ai_runs`
  row per attempt. Each feature is one file in `src/lib/ai/` with a schema and a prompt in
  `src/lib/ai/prompts/*.md`. Change a prompt, bump its `version`. Call `refuseAiCall()`
  before any model call in a route. Model ids live in one table in the module; check they
  are still served before changing them.
- **UI is built on the design tokens** (`docs/design.md`): `bg-surface`, `text-ink-2`,
  `rounded-card`, `text-h2` and the components in `src/components/ui/`. No hex colours,
  default Tailwind palette names or new one-off buttons in screens.
- **The theme is set on a root element, not by React.** `src/lib/theme.ts` applies the choice
  to the element with `APP_ROOT_ID` (the app shell and the landing page each have one), and a
  script beside it applies the remembered choice before first paint. `ThemeToggle` switches it;
  in the app the choice is also saved to the profile. Auth pages are always light.
- **Scroll reveals share `revealViewport` from `src/lib/motion.ts`.** It starts
  the animation before the section enters view; per-component viewport settings
  reintroduce the "page fills in late" effect.
- **Dates are the user's dates.** Use `todayIn()`, `weekIn()` and `startOfDayIn()` from
  `src/lib/dates.ts` with the profile's timezone. Never `new Date().toISOString().split('T')[0]`:
  that is UTC's date, which is wrong in Lagos for an hour every night.
- **A plan step is done when its inbox item is done.** Plans are `daily_plans` plus
  `daily_plan_items`; progress is counted, never stored. Write a plan with the
  `save_daily_plan` RPC and read it with `loadDailyPlan()`.
- **The model never produces a number.** Counts, rates and trends come from SQL
  (`week_stats()`, `plan_candidates()`) and `src/lib/weekly.ts`, are passed into the prompt,
  and are stored from the computed values, not from the model's answer.
- **Ask your notes retrieves before it writes** (`docs/decisions/005`). Items are embedded by
  the `embed` Edge Function (`supabase/functions/embed`, gte-small) into `item_embeddings`;
  `match_items()` is the only search. The answer's `[n]` markers are placed by code from the
  model's structured claims (`src/lib/ask.ts`). After touching retrieval or the prompt, run
  the Ask eval (push a branch named `evals/ask-<something>`).
- **Each demo visitor gets a private account** (`src/lib/demo.ts`, `/auth/demo`), marked
  `{"demo": true}` in app metadata, filled by `seed_demo()` and deleted after a day by the
  nightly cleanup. `seed_demo()` is also what the local seed calls, so the demo's content has
  one definition: change it in a new migration, and keep `evals/ask.jsonl` in step. Routes
  that change an account itself (password, deletion, billing) refuse demos with `isDemo(user)`.
- Don't ship UI that doesn't work. A button with no handler, or a save that is a
  `setTimeout`, is worse than no button.
- Keep marketing copy to claims the product can back up.

## Database

Change the schema only with a new migration in `supabase/migrations/`, then run
`npm run db:types`. CI applies every migration and the seed to a fresh database, runs
the pgTAP tests and fails if the committed types don't match the migrations.

## Billing and quota

Plan and AI usage are server-owned (`docs/decisions/006`). `subscriptions`, `ai_runs`,
`payment_events` and `payment_transactions` are written only through
`createAdminClient()`; users can read their own rows and nothing else. Check access
with `getQuota()` and record every model call with `recordAiRun()` from
`src/lib/billing/quota.ts`. Never add a billing or usage column to `profiles`, and never
grant a client role more than `select` on those tables.

## Checks

```
npm run lint
npm run typecheck
npm test
npm run build
```

Every variable is listed in `.env.example`. `next build` needs only the three
`NEXT_PUBLIC_*` values; the server checks the secrets when it starts.

## Git

Work happens on `feat/`, `fix/`, `chore/` branches, one per issue, each PR into
`remodel`. `main` is only updated when `remodel` is merged as a whole.
