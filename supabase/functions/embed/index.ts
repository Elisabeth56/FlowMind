// Embeds text with gte-small, the model built into Supabase's edge runtime, so notes
// never leave Supabase to be embedded (docs/decisions/005).
//
//   { "query": "..." }  ->  { embedding }           embed a question
//   {}                  ->  { embedded, remaining } embed the caller's items that have none
//
// Everything runs as the caller: row level security decides which items it can read
// and which embeddings it can write.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const model = new Supabase.ai.Session('gte-small')
const embed = (text: string) =>
  // gte-small reads about 512 tokens; items are short, a pasted essay is cut off here
  model.run(text.slice(0, 2000), { mean_pool: true, normalize: true }) as Promise<number[]>

// Small on purpose: the hosted free plan stops a function after about two seconds of CPU
// (it answers 546), and 25 embeddings in one call went over. The caller keeps asking
// until nothing remains.
const BATCH = 5

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const body = await request.json().catch(() => ({}))
    if (typeof body.query === 'string') {
      if (!body.query.trim()) return json({ error: 'Empty query' }, 400)
      return json({ embedding: await embed(body.query) })
    }

    const { data: items, error } = await supabase.rpc('items_to_embed', { p_limit: BATCH })
    if (error) throw new Error(error.message)

    const rows = []
    for (const item of items ?? []) {
      rows.push({ item_id: item.id, user_id: user.id, embedding: JSON.stringify(await embed(item.body)) })
    }
    if (rows.length > 0) {
      const { error: writeError } = await supabase.from('item_embeddings').upsert(rows)
      if (writeError) throw new Error(writeError.message)
    }
    // A full batch means there may be more; the caller asks again
    return json({ embedded: rows.length, remaining: rows.length === BATCH })
  } catch (error) {
    console.error('embed:', error)
    return json({ error: 'Could not embed' }, 500)
  }
})
