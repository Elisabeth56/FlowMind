# FlowMind Landing Page

A modern, responsive landing page for FlowMind — an AI productivity OS that acts as your second brain. Built with the 2026 tech stack.

## What is FlowMind?

FlowMind is a SaaS productivity app where users can:
- **Dump notes, tasks, and ideas** into a unified inbox
- **Let AI auto-organize** them into projects, priorities, and action plans
- **Ask "What should I focus on today?"** and get a reasoned daily plan
- **Get weekly AI-generated summaries** of what they accomplished vs. planned

## Tech Stack

- **Next.js 15.1** with App Router and Turbopack
- **React 19** with Server Components
- **Tailwind CSS 4.0** with CSS-first configuration
- **Motion 12** (formerly Framer Motion) for animations
- **TypeScript 5.7**
- **Lucide React** for icons

## Ask your notes setup

Search and answers need one Edge Function, deployed once per Supabase project:

```
supabase functions deploy embed
```

It embeds items and questions with gte-small, the model built into Supabase's edge
runtime, so it needs no key. Items are embedded the first time the Ask screen is opened
and again after they are edited. If the function is not deployed, Ask falls back to
keyword search.

## Auth setup

Sign-up, sign-in, Google and password reset run on Supabase Auth. Three things are set
once in the dashboards; the code needs no keys for any of them.

**1. URLs** (Supabase → Authentication → URL Configuration)

- Site URL: the production address, for example `https://flowmind.example`
- Redirect URLs: `https://flowmind.example/auth/callback**` and
  `http://localhost:3000/auth/callback**`. Add the Vercel preview pattern too if previews
  should be able to sign in: `https://*-<your-team>.vercel.app/auth/callback**`

**2. Email templates** (Supabase → Authentication → Email Templates)

Paste the three files from `supabase/templates/` into "Confirm signup", "Reset password"
and "Change email address". Their links go to `/auth/confirm` with a token hash, so a
link opened on a different device still signs the person in.

**3. Google** (optional)

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth
   client ID → Web application.
2. Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Copy the client ID and secret into Supabase → Authentication → Providers → Google,
   and enable the provider.

Until step 3 is done the Google button answers "That sign-in method is not available
right now."

## AI providers

Every model call goes through `src/lib/ai/index.ts`. It tries Groq's model for the job,
then Groq's other model (free limits are per model), then Gemini if a key is set.

When nothing answers, the app degrades instead of breaking: capture always saves, an
item that could not be organised is marked for retry, and the daily plan is built by
rule (due first, then priority) and says so. Prompts are files in
`src/lib/ai/prompts/`, each with a version that is logged with every call in `ai_runs`.

| | Fast (organise) | Smart (plan, summarise, ask) | Key |
|---|---|---|---|
| Groq (primary) | `openai/gpt-oss-20b` | `openai/gpt-oss-120b` | `GROQ_API_KEY` |
| Gemini (optional second provider, off by default) | `gemini-3.5-flash-lite` | `gemini-3.8-flash` | `GOOGLE_GENERATIVE_AI_API_KEY` |

Free-tier notes, checked 2026-10-02:

- Both providers set free limits per account and per model (requests and tokens per
  minute and per day) and change them often. The current numbers are in each console:
  [Groq limits](https://console.groq.com/settings/limits),
  [Gemini limits](https://aistudio.google.com/rate-limit).
- Groq removed `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` from the free tier on
  2026-08-16; the `gpt-oss` models are its recommended replacements.
- Gemini 2.5 models are closed to new projects; 3.5 Flash-Lite and 3.8 Flash are current.
- On Gemini's free tier Google may use requests to improve its products. Leave
  `GOOGLE_GENERATIVE_AI_API_KEY` unset to keep every note on Groq, at the cost of no fallback.

The app adds its own limits on top: 50 AI units a month on the free plan and 30 model
calls a minute per user.

## Features

- 💙 Light blue/azure color scheme
- ✨ Smooth scroll-triggered animations
- 📱 Fully responsive design
- 🎨 Custom CSS variables via Tailwind v4 `@theme`
- ⚡ Optimized with Turbopack dev server
- 🔤 Google Fonts (DM Sans + Playfair Display)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server (with Turbopack):**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
flowmind-landing/
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind v4 with @theme
│   │   ├── layout.tsx       # Root layout with fonts
│   │   └── page.tsx         # Main page
│   └── components/
│       ├── Navbar.tsx       # Fixed navigation with logo
│       ├── Hero.tsx         # Hero with app preview
│       ├── TrustBar.tsx     # Featured in + stats
│       ├── Features.tsx     # 4 feature cards
│       ├── HowItWorks.tsx   # 3-step process
│       ├── DailyPlan.tsx    # AI chat mockup
│       ├── WeeklySummary.tsx # Summary card + CTA
│       └── Footer.tsx       # Dark footer with links
├── next.config.ts           # Next.js 15 config
├── postcss.config.mjs       # Tailwind v4 PostCSS
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## Color Palette

Custom azure/sky blue color system defined in `globals.css`:

- **Azure**: Primary blue (`--color-azure-50` to `--color-azure-900`)
- **Slate**: Neutral tones for text and backgrounds
- **Violet**: Accent purple for gradients
- **Sky**: Lighter blue accent

## Sections

1. **Hero** — Main headline, CTA buttons, app preview mockup
2. **Trust Bar** — Featured logos and key stats
3. **Features** — 4 cards: Unified Inbox, AI Organization, Daily Plans, Weekly Summaries
4. **How It Works** — 3-step visual process
5. **Daily Plan** — Interactive AI chat mockup
6. **Weekly Summary** — Sample report card with insights
7. **Footer** — Dark footer with newsletter signup

## License

MIT
