# 002 Backend shape

Status: proposed

## Context

Backend work today: CRUD (mostly direct Supabase calls under RLS), three AI endpoints, Paystack checkout and webhook, data export. The longest request is the daily plan on the larger model: a few seconds, under 15 s at worst. No WebSockets of our own (Supabase Realtime covers live updates), no queues, no Python-only libraries.

## Options

| | Next.js only (route handlers + server actions) | Next.js + Express (`apps/server`) | Next.js + FastAPI (`apps/api`) |
|---|---|---|---|
| Fits current work | Yes: everything is short request/response or streaming | Adds a second deploy for no long-running work | Only useful for Python AI libraries we don't need |
| Serverless limits | Plan stays well inside Vercel's function limit; stream it | Removes the limit we aren't hitting | Same |
| Ops | One deploy, one env | Two deploys, a host for long-lived processes | Two runtimes, two toolchains |
| Portfolio signal | Clean, idiomatic | Looks like more, is more to maintain | Same |

## Decision

Next.js only. Server actions for the app's own mutations (profile, preferences, project edits), route handlers for AI endpoints (streaming), the Paystack webhook and export. Each feature gets one folder under `src/features/<feature>` with its schemas and logic as plain functions; routes stay thin. Scheduled work (keep-alive, optional Sunday summary) uses Vercel Cron.

## Consequences

- One deploy, one env file, one set of tests.
- If organize moves to batch-processing large imports, or summaries move to scheduled generation for every user, that work outgrows a request.

## Revisit when

A job needs more than ~60 s, or a mobile client or partner needs a versioned public API.
