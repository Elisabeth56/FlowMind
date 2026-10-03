import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { isPro } from '@/lib/billing/entitlement'
import { aiErrorResponse } from '@/lib/ai/http'
import { answerFromNotes } from '@/lib/ai/ask-notes'
import { foundSomething, type Match } from '@/lib/ask'
import { safeTimeZone, todayIn } from '@/lib/dates'

const bodySchema = z.object({ question: z.string().trim().min(2).max(500) })

const NOT_FOUND = 'I couldn’t find anything about that in your notes.'

// POST - answer a question from the user's own items, with the items it used
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = bodySchema.safeParse(await request.json().catch(() => null))
    if (!body.success) {
      return NextResponse.json({ error: 'Ask a question of up to 500 characters' }, { status: 400 })
    }
    const { question } = body.data

    const [{ data: subscription }, { data: profile }] = await Promise.all([
      supabase.from('subscriptions').select('tier, status').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('timezone').eq('id', user.id).single(),
    ])
    if (!isPro(subscription)) {
      return NextResponse.json({ error: 'Ask your notes is part of Pro' }, { status: 403 })
    }

    // The question's embedding. If the embed function is down, search by keywords alone.
    const { data: embedded } = await supabase.functions.invoke('embed', { body: { query: question } })
    const embedding: number[] | null = Array.isArray(embedded?.embedding) ? embedded.embedding : null

    const { data: matches, error: searchError } = await supabase.rpc('match_items', {
      p_query: question,
      p_embedding: embedding ? JSON.stringify(embedding) : undefined,
      p_limit: 8,
    })
    if (searchError) throw new Error(`Search failed: ${searchError.message}`)
    const found = (matches ?? []) as Match[]

    // Nothing close: say so without spending a model call on a guess
    if (!foundSomething(found)) {
      return NextResponse.json({ success: true, found: false, answer: NOT_FOUND, sources: [] })
    }

    const refusal = await refuseAiCall(supabase, user.id)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    const timeZone = safeTimeZone(profile?.timezone)
    const written = await answerFromNotes({ userId: user.id, question, matches: found, today: todayIn(timeZone), timeZone })

    return NextResponse.json({
      success: true,
      found: written.found,
      answer: written.answer,
      // Only the sources the answer cites, keeping the numbers the answer uses
      sources: written.cited
        .sort((a, b) => a - b)
        .map((n) => ({
          n,
          id: found[n - 1].id,
          content: found[n - 1].content,
          item_type: found[n - 1].item_type,
          project_name: found[n - 1].project_name,
          created_at: found[n - 1].created_at,
        })),
    })
  } catch (error) {
    console.error('Ask API error:', error)

    const aiFailure = aiErrorResponse(error)
    if (aiFailure) return aiFailure

    return NextResponse.json({ error: 'Could not answer that. Try again.' }, { status: 500 })
  }
}
