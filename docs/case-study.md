# FlowMind: rebuilding a prototype into a product

*Case study draft. First person, for the portfolio site and LinkedIn.*

## Context

FlowMind is a second brain for people with too many inputs. You drop tasks, notes, links and half-ideas into one inbox; it files them, plans your day, and answers questions from what you saved.

I had built a first version quickly. It looked finished and was not: most of the buttons in the app did nothing, and the AI features had stopped working without anyone noticing. This is the story of the rebuild.

## What was wrong

I started with an audit instead of new features. Three findings shaped everything after.

**Anyone could give themselves Pro.** The plan and the AI usage counter lived on the profile row, and the database let a user update their whole row. One request from the browser console set `subscription_tier` to `pro`. I confirmed it against the live database before fixing it.

**The AI had been down for weeks.** Groq retired the Llama models the app called. Every organize and plan request failed, and nothing logged it or told the user.

**The model was asked to invent numbers.** The weekly summary asked for a "focus score" and a completion rate. It produced confident figures that matched nothing in the data.

Constraints: free tiers only (Supabase, Vercel, Groq), users in Nigeria first (Paystack, naira, Lagos time), and one developer.

## Approach

**Move the trust boundary into the database.** Plan and usage now live in tables only the server can write; the free quota is a count of logged AI calls in the user's own month. Database tests try the old attack on every pull request.

**Replace the framework with one small module.** Every AI feature here is a single structured call, so I removed LangChain. `src/lib/ai` has one function for schema-validated output and one for streaming, tries a second model and then a second provider when the first fails, sets a timeout, and writes one log row per attempt with the model, prompt version, tokens and latency. When nothing answers, the app still works: capture saves, items wait for a retry, and the daily plan is built by rule and says so.

**Numbers come from SQL, words from the model.** Counts, rates and trends are computed in Postgres and handed to the model to write about. A plan may only schedule items it was given; anything else is rejected in code.

**Measure, then change the prompt.** I wrote eval sets before tuning: 40 notes to file, 15 days to plan, 40 questions to answer.

## What the evals taught me

- The small model returned a Sunday for "by Monday" when given only today's date. A two-week calendar in the prompt took due dates from 94% to 100%.
- A note that told the model what priority to set got its way until the rule against following instructions was repeated after the note.
- For Ask your notes, the first run gave 32 correct answers and zero citations. The model ignored "cite as [1]" in free text. I changed the output to a list of claims, each with its source numbers, and let code place the markers. The next run cited the right note 32 times out of 32.
- I planned to detect "not in your notes" with a similarity threshold. The eval showed it cannot work with this embedding model: unanswerable questions scored up to 0.88 and answerable ones as low as 0.82. The model now decides from the sources, and the eval checks that it does: 8 of 8.

## Results

| | |
|---|---|
| Filing: kind, due date, priority, actionable, resists injected instructions | 100% of 40 |
| Filing: project | 92% |
| Daily plan: valid items, ordering, due items, total time | 100% of 15 |
| Ask: recall@8 | 1.00 (MRR 0.75) |
| Ask: cites the right note / says "not found" | 32 of 32 / 8 of 8 |
| Latency p95: file an item, plan a day | 1.5 s, 3.1 s |
| Landing page, Lighthouse mobile (local build) | 94 performance, 100 accessibility, best practices and SEO |

Every screen is rebuilt on one design system, every button does what it says, and "Try the demo" gives a visitor a private, seeded account without signing up.

## What I would do next

- The retrieval eval is one seeded account of 48 notes, where plain embeddings do as well as hybrid search. I want a few thousand messy real notes before I trust the ranking.
- The app sends no email. Reminders and a Sunday summary in the inbox are the obvious next feature, and the settings for them are already in the schema.

## What I learned

The audit was worth more than any feature. Two of the three worst problems were invisible from the interface, and I only found them by reading policies and logs instead of clicking around. The evals paid for themselves on the first day: I would have guessed wrong on each of the changes above.
