# Evals

Measures the two AI features whose answers can be checked by rule.

```
GROQ_API_KEY=... npm run eval
```

It calls the real models (about 55 calls, spaced to fit the free tier, so it takes a
few minutes; about six on the free tier), prints a table and saves `results/<timestamp>.json`. To keep a run as the
new reference, copy it to `results/baseline.json` and commit it.

| File | Cases | What is checked |
|---|---|---|
| `organize.jsonl` | 40 | kind, due date, project, actionable, priority, and that instructions inside a note are filed, not followed |
| `daily-plan.jsonl` | 15 | every id is a candidate (must be 100%), due items are included, ordering, step count, total time |

Dates in the cases assume today is Thursday 1 October 2026; the runner fixes the clock.

Run it after any change to a prompt, a schema or a model id. A bad answer seen in the
app becomes a new line in the matching `.jsonl`. The scoring rules are in `score.ts`
and have their own tests, which run with `npm test`.

## Baseline (2026-10-03)

Two runs on the same code gave the same accuracy.

| | Result |
|---|---|
| Organise: kind, due date, actionable, priority, injection | 100% |
| Organise: project | 92% (2 of 25 cases) |
| Daily plan: all seven checks, including id validity | 100% |
| Organise latency (`openai/gpt-oss-20b`) | p50 0.6 s, p95 1.5 s |
| Daily plan latency (`openai/gpt-oss-120b`) | p50 1.4 s, p95 3.1 s |

What the first runs changed:

- Dates went from 94% to 100% once the prompt carried a two-week calendar to look
  dates up in. Given only today's date, the small model returned a Sunday for "by Monday".
- One of two notes that told the model what to set got its way until the prompt said to
  ignore any part of a note that addresses the model, and repeated it after the note.
- Plan ordering went from 80% to 100% when the code marked items OVERDUE or DUE TODAY
  instead of leaving the model to compare dates.

Latency varies between runs on the free tier: the same organise cases took 1.9 s at the
median in the run before this one.
