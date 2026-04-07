# FlowMind Landing Page

A modern, responsive landing page for FlowMind — an AI productivity OS that acts as your second brain. Built with the 2026 tech stack.

## What is FlowMind?

FlowMind is a SaaS productivity app where users can:
- **Dump notes, tasks, and ideas** into a unified inbox
- **Let AI (Groq + Mistral) auto-organize** them into projects, priorities, and action plans
- **Ask "What should I focus on today?"** and get a reasoned daily plan
- **Get weekly AI-generated summaries** of what they accomplished vs. planned

## Tech Stack

- **Next.js 15.1** with App Router and Turbopack
- **React 19** with Server Components
- **Tailwind CSS 4.0** with CSS-first configuration
- **Motion 12** (formerly Framer Motion) for animations
- **TypeScript 5.7**
- **Lucide React** for icons

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
