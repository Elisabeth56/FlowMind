# FlowMind

## Commits

Never add AI attribution to anything in this repo. No `Co-Authored-By: Claude`
trailer, no `Claude-Session:` line, no "Generated with Claude Code" footer — in
commit messages, pull request descriptions, code comments, or anywhere else.

Commit as the repository owner:

```
git config user.name "Elisabeth"
git config user.email "nnamanielisabeth@gmail.com"
```

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase · LangChain on Groq ·
Paystack.

## Layout

- `src/app/` — routes. `/` is the marketing site, `/dash/*` the signed-in app,
  `/api/*` the route handlers.
- `src/components/` — marketing-site components. In-app UI lives beside its route.
- `src/hooks/` — client data hooks (`useAuth`, `useInboxItems`, `useProjects`,
  `useAI`, `useSubscription`).
- `src/lib/` — `ai/` (chains + Groq), `supabase/`, `paystack/`, `plans.ts`.
- `src/types/database.ts` — hand-maintained Supabase schema types.

## Conventions

- **Pricing lives in `src/lib/plans.ts`.** The marketing page, the in-app billing
  screen and the Paystack checkout route all read from it. Never hardcode an
  amount anywhere else.
- **Never construct a Groq client or LangChain chain at module scope.** The SDK
  throws without `GROQ_API_KEY`, and `next build` imports every route module, so
  eager construction fails the build. Use `getModel()` and `lazyChain()`.
- **Scroll reveals share `revealViewport` from `src/lib/motion.ts`.** It starts
  the animation before the section enters view; per-component viewport settings
  reintroduce the "page fills in late" effect.
- Don't ship UI that doesn't work. A button with no handler, or a save that is a
  `setTimeout`, is worse than no button.
- Keep marketing copy to claims the product can back up.

## Checks

```
npm run lint          # eslint flat config
npx tsc --noEmit
npm run build
```

`build` needs `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, and the two
`PAYSTACK_PRO_*_PLAN_CODE` values for live checkout.
