# 006 Billing state and AI quota

Status: proposed

## Context

Confirmed on the live database: the policy "Users can update own profile" has no column restriction and `authenticated` has table-level UPDATE, so any signed-in user can set `subscription_tier`, `subscription_status` or reset `ai_calls_this_month` from the browser with the public key. Route handlers also write the counter with the user's own session, so the policy can't simply be tightened without breaking them. The Supabase advisor also flags three `SECURITY DEFINER` functions callable by `anon` and mutable `search_path`s. Paystack webhooks are not idempotent: a retried event reapplies its update.

## Options

| | Column grants on `profiles` | Separate `subscriptions` + `ai_runs` tables (service-role writes) | Keep the counter, move writes to an RPC |
|---|---|---|---|
| Closes the hole | Yes, if every billing column is revoked | Yes, by construction | Yes for the counter; tier still needs grants |
| Clarity | Easy to undo by accident with a later `grant update` | Billing and usage obviously server-owned | Mixed |
| Quota accuracy | Counter can drift on failures | Count of real rows; failed runs can be excluded | Counter |
| Audit trail | None | Every AI call recorded with tokens and latency | Partial |

## Decision

Recommended: **separate tables.** `subscriptions` (one row per user, written only by the Paystack webhook through the service role), `ai_runs` (inserted only by the server), `payment_events` (unique Paystack event id, so webhooks are idempotent). Free-tier quota = successful `ai_runs` this calendar month in the user's timezone. Users keep update rights on `profiles` for name, timezone and preferences only. Fix the advisor findings in the same migration: pin `search_path`, revoke `EXECUTE` on trigger functions from `anon` and `authenticated`, enable leaked-password protection.

## Consequences

- One migration moves the 5 existing profiles' billing fields into `subscriptions`; no data loss.
- `useSubscription` and the billing page read from `subscriptions`.
- The Insights page gets real usage data for free.

## Revisit when

We add team plans or usage-based pricing.
