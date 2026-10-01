# 001 Database

Status: proposed

## Context

Items, projects, plans and summaries are all owned by one user and joined constantly: Today joins plan items to inbox items to projects; Insights aggregates items by week and project; the quota check counts AI runs per month. Billing needs transactions and idempotency. Data is small (see `architecture.md`, under 500 MB at the realistic 12-month number). A live Supabase project already exists with 7 tables, RLS on all of them, 7 test users and a few rows.

## Options

| | Supabase Postgres (current) | Firestore | Neon Postgres + Drizzle |
|---|---|---|---|
| Fit | Relational joins and aggregates are the main access pattern | Plans→items→projects needs denormalizing or client joins; weekly stats need extra aggregation docs | Same SQL fit |
| Auth + access rules | Auth, RLS and Realtime in one place | Security rules, good realtime | Bring your own auth and realtime |
| Vectors (ADR 005) | pgvector built in | Vector search exists but separate from the rest of the query | pgvector |
| Ops / cost | Free tier, pauses after a week idle | Free tier, no pausing | Free tier with scale-to-zero; more pieces to wire |
| Migration cost | None | Full rewrite | Data move plus new auth and realtime |

## Decision

Stay on Supabase Postgres. Capture the live schema as a baseline migration in `supabase/migrations`, then change it forward with the data model in `architecture.md`. Types are generated, not hand-written.

## Consequences

- Schema becomes reviewable and reproducible; `supabase db reset` gives a working local database with a demo account.
- Free projects pause when idle; a weekly keep-alive cron and a README note cover it.

## Revisit when

Storage passes ~400 MB, or a feature needs offline-first sync on mobile.
