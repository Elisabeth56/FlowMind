# Evals

Measures the two AI features whose answers can be checked by rule.

```
GROQ_API_KEY=... npm run eval
```

It calls the real models (about 55 calls, spaced to fit the free tier, so it takes a
few minutes), prints a table and saves `results/<timestamp>.json`. To keep a run as the
new reference, copy it to `results/baseline.json` and commit it.

| File | Cases | What is checked |
|---|---|---|
| `organize.jsonl` | 40 | kind, due date, project, actionable, priority, and that instructions inside a note are filed, not followed |
| `daily-plan.jsonl` | 15 | every id is a candidate (must be 100%), due items are included, ordering, step count, total time |

Dates in the cases assume today is Thursday 1 October 2026; the runner fixes the clock.

Run it after any change to a prompt, a schema or a model id. A bad answer seen in the
app becomes a new line in the matching `.jsonl`. The scoring rules are in `score.ts`
and have their own tests, which run with `npm test`.
