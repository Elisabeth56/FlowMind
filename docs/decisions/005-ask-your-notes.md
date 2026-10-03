# 005 Ask your notes (retrieval)

Status: accepted (2026-10-01)

## Context

"Second brain" promises that you can get things back out. Today the only way is scrolling the inbox; the existing "ask" action answers from three numbers about today's plan, not from the notes. This is the feature that makes FlowMind a second brain rather than a to-do list with AI labels, and it is the strongest AI signal for the portfolio. It is level 2 on the escalation ladder (prompt + retrieved context), justified by the product promise; we measure it with retrieval evals before calling it done.

Data is small per user (hundreds to a few thousand short items), always filtered by `user_id`, and the items already live in Postgres.

## Options

| | No retrieval (current) | pgvector + Supabase built-in `gte-small` embeddings | pgvector + Gemini embeddings |
|---|---|---|---|
| Value | Search by scrolling | Semantic + keyword search, grounded answers with citations | Same |
| Where embeddings run | — | Supabase Edge Function (`Supabase.ai`), free, notes never leave Supabase for embedding | Google API, free tier data terms apply |
| Quality | — | 384-dim, solid for short notes in English | Stronger multilingual |
| Ops | — | One edge function, one DB trigger or call after insert | One API key, rate limits |
| Storage | — | ~1.5 KB/item | ~3 KB/item at 768 dims |

## Decision

Recommended: **pgvector + `gte-small` in a Supabase Edge Function.** Each item is short, so one item = one chunk (no splitter needed), with the project name prepended as a header. Hybrid search (vector + `tsvector` full text, reciprocal rank fusion) in one SQL function filtered by `auth.uid()`. Top 8 go to the model with numbered ids; the answer cites them, the UI links to the items, and below a score threshold the answer says it didn't find anything instead of guessing. Ship with a retrieval eval (recall@8 and MRR on ~30 questions over a seeded demo account).

## Consequences

- New: `embedding vector(384)`, `fts tsvector` generated column, HNSW + GIN indexes, `match_items` RPC, `embed` edge function.
- The demo account becomes much more convincing: seeded notes you can actually ask questions of.
- Adds maybe a day to the build. If time runs short, it lands after the core fixes as its own PR.

## Revisit when

Users attach long documents (then real chunking and a documents table), or answers need non-English notes and the eval shows gte-small missing them.

## As built (2026-10-03)

Three things differ from the plan above, each for a reason found while building:

- **Embeddings live in `item_embeddings`, not in a column on `inbox_items`.** The app reads items with `select *` and over realtime; a 384-number column would ride along on every read. An edited item's embedding row is deleted by a trigger, and `items_to_embed()` lists whatever has none.
- **No `fts` column.** Keyword search uses a GIN index on `to_tsvector('english', content)` directly.
- **The score threshold is not what decides "not found".** gte-small puts unrelated short notes at about 0.8 similarity, and the unanswerable questions in the eval scored up to 0.88, above many answerable ones. The threshold (plus "no shared word") stops only the clearly off-topic quarter before a model call. For the rest the model gets the sources and returns `found: false`; the eval measures that step too.

Citations are structured: the model returns claims, each with its source numbers, and the code places the `[n]` markers. Asked to write `[n]` inside free text, the model answered correctly and left every marker out.

Measured on the seeded demo account (48 items, 32 answerable and 8 unanswerable questions, `evals/results/ask-baseline.json`): recall@8 1.00 for hybrid and for embeddings alone, 0.84 for keywords alone. At this size the keyword half adds no recall; it is kept so search still works when the embed function is down, and for exact names and numbers as notes grow.
