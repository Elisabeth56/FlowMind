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

Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase · LangChain on Groq ·
Paystack.

## Layout

- `src/app/` — routes. `/` is the marketing site, `/dash/*` the signed-in app,
  `/api/*` the route handlers.
- `src/components/` — marketing-site components. In-app UI lives beside its route.
- `src/hooks/` — client data hooks (`useAuth`, `useInboxItems`, `useProjects`,
  `useAI`, `useSubscription`).
- `src/lib/` — `env.ts` (validated env), `ai/` (chains + Groq), `supabase/`, `paystack/`, `plans.ts`.
- `src/types/database.ts` — hand-maintained Supabase schema types.

## Conventions

- **Read env through `src/lib/env.ts`.** `publicEnv()` for `NEXT_PUBLIC_*`, `serverEnv()`
  for secrets, always inside a function (never at module scope, which runs during
  `next build`). Add new variables to the schema and to `.env.example`.
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
