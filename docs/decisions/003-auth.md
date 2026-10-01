# 003 Auth

Status: proposed

## Context

Needed: email + password with verification, Google sign-in, password reset (issue #9), sessions on the server for RSC and route handlers, and user ids that RLS can check. Today email sign-up works but the verification link lands on a 404, reset points at a page that doesn't exist, and Google has a server action but no working provider config.

## Options

| | Supabase Auth (current) | Clerk | Better Auth |
|---|---|---|---|
| RLS integration | `auth.uid()` works natively | Needs JWT template and third-party auth setup in Supabase | Needs custom JWT signing for RLS |
| UI | Build our own (fits the design system) | Polished prebuilt UI, harder to make feel like FlowMind | Build our own |
| Cost | Free tier generous | Free tier, then per MAU | Free, self-owned |
| Work to fix #9 | Add `/auth/confirm` (token_hash), reset page, Google provider config | Replace everything | Replace everything |

## Decision

Keep Supabase Auth. Fix the flows: `/auth/confirm` for email links (token_hash + type, works across devices unlike PKCE code links), `/forgot-password` and `/reset-password` pages, Google OAuth through `/auth/callback`. Turn on leaked-password protection (flagged by the Supabase advisor).

## Consequences

- Google needs an OAuth client in Google Cloud and the redirect URLs set in Supabase; I'll write the exact steps, you paste the client id and secret.
- Email templates in Supabase must point at `/auth/confirm`; set once in the dashboard and documented.

## Revisit when

We need organizations/teams or enterprise SSO.
