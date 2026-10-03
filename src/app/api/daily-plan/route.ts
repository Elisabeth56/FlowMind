import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { aiErrorResponse } from '@/lib/ai/http'
import { askAboutDay, planDay, planDayStream, type PlanCandidate, type PlannedDay } from '@/lib/ai/plan-day'
import { AiError } from '@/lib/ai'
import {
  fallbackPlanSteps,
  keepCompletedSteps,
  loadDailyPlan,
  planStartTime,
  previewPlan,
  toPlanSteps,
  type LoadedDailyPlan,
  type PlanStep,
} from '@/lib/daily-plan'
import { safeTimeZone, startOfDayIn, todayIn } from '@/lib/dates'
import type { Json } from '@/types/models'

async function userToday(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).single()
  return todayIn(data?.timezone ?? 'UTC')
}

type Client = Awaited<ReturnType<typeof createClient>>
type Plan = { reasoning: string; energy_recommendation: string; steps: PlanStep[] }

const UNAVAILABLE_REASONING =
  'The AI is unavailable right now, so this plan is ordered by due date and priority. Regenerate it later for a reasoned one.'

/** What the model is told about the day when the user asks a question. */
function describeDay(plan: LoadedDailyPlan | null, openItems: PlanCandidate[]): string {
  if (!plan) {
    return `No plan for today yet.\nOpen items:\n${openItems.map((item) => `- ${item.content}`).join('\n') || 'none'}`
  }
  const steps = plan.plan_items.map(
    (step) =>
      `- ${step.scheduled_time ?? 'any time'}: ${step.item.content} (${step.item.status === 'completed' ? 'done' : 'not done'})`
  )
  const planned = new Set(plan.plan_items.map((step) => step.item_id))
  const others = openItems.filter((item) => !planned.has(item.id)).map((item) => `- ${item.content}`)
  return [
    `Why this plan: ${plan.reasoning}`,
    `Steps (${plan.items_completed} of ${plan.items_total} done):`,
    ...steps,
    'Open items not in the plan:',
    ...(others.length > 0 ? others : ['none']),
  ].join('\n')
}

/** Open items ranked by the database: due first, then priority. */
async function loadCandidates(supabase: Client, today: string): Promise<PlanCandidate[]> {
  const { data, error } = await supabase.rpc('plan_candidates', { p_today: today })
  if (error) throw new Error(`Could not load items: ${error.message}`)
  // The generated type cannot say these two are nullable; the columns are
  return (data ?? []) as PlanCandidate[]
}

// POST - generate today's plan (streamed), regenerate it, or ask a question about the day
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action = 'generate', question } = await request.json()

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // The user's own date: a server in UTC is a day behind Lagos for an hour every night
    const today = todayIn(profile.timezone)
    const existingPlan = await loadDailyPlan(supabase, user.id, today)

    if (action === 'ask' && typeof question === 'string' && question.trim()) {
      const refusal = await refuseAiCall(supabase, user.id)
      if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

      const answer = await askAboutDay({
        userId: user.id,
        today,
        planSummary: describeDay(existingPlan, await loadCandidates(supabase, today)),
        question: question.trim().slice(0, 500),
      })
      return NextResponse.json({ success: true, answer })
    }

    if (existingPlan && action !== 'regenerate') {
      return NextResponse.json({ success: true, plan: existingPlan, cached: true })
    }

    // Checked only now: showing a plan that already exists costs nothing
    const refusal = await refuseAiCall(supabase, user.id)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    const [candidates, { data: projects }, { count: completedToday }] = await Promise.all([
      loadCandidates(supabase, today),
      supabase.from('projects').select('name').eq('user_id', user.id).eq('status', 'active'),
      supabase
        .from('inbox_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startOfDayIn(profile.timezone, today).toISOString()),
    ])

    const input = {
      userId: user.id,
      items: candidates,
      projects: (projects ?? []).map((project) => project.name),
      timeZone: profile.timezone,
      preferredStart: profile.daily_plan_time,
      completedToday: completedToday ?? 0,
    }
    const candidateIds = candidates.map((item) => item.id)
    const contentById = new Map(candidates.map((item) => [item.id, item]))
    // The model may only schedule items we offered
    const fromModel = (planned: PlannedDay): Plan => ({
      reasoning: planned.reasoning,
      energy_recommendation: planned.energy_recommendation,
      steps: toPlanSteps(planned.plan_items, candidateIds),
    })

    // From here the answer is a stream of JSON lines: the plan as the model writes it,
    // then the saved plan. The client shows each line as it arrives.
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      async start(controller) {
        const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        try {
          let plan: Plan
          let degraded = false
          try {
            const streamed = await planDayStream(input)
            for await (const partial of streamed.partials) {
              send({ type: 'partial', plan: previewPlan(partial, contentById) })
            }
            plan = fromModel(await streamed.object)
          } catch (error) {
            if (!(error instanceof AiError)) throw error
            if (error.kind === 'invalid_output') {
              // The streamed answer did not hold together: ask once more, with a retry inside
              plan = fromModel(await planDay(input))
            } else {
              // No model answered: plan by rule rather than leave the user without a day
              degraded = true
              plan = {
                reasoning: UNAVAILABLE_REASONING,
                energy_recommendation: '',
                steps: fallbackPlanSteps(
                  candidates,
                  today,
                  planStartTime(profile.daily_plan_time, safeTimeZone(profile.timezone))
                ),
              }
            }
          }

          // Plan and steps are written together; what is already done today stays in the plan
          const { error: saveError } = await supabase.rpc('save_daily_plan', {
            p_plan_date: today,
            p_reasoning: plan.reasoning,
            p_energy_recommendation: plan.energy_recommendation,
            p_items: keepCompletedSteps(existingPlan?.plan_items ?? [], plan.steps) as unknown as Json,
          })
          if (saveError) throw new Error(`Could not save plan: ${saveError.message}`)

          send({ type: 'done', plan: await loadDailyPlan(supabase, user.id, today), degraded })
        } catch (error) {
          console.error('Daily plan API error:', error)
          send({
            type: 'error',
            error:
              error instanceof AiError
                ? 'The AI gave an answer we could not use. Try again.'
                : 'Failed to generate daily plan',
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Daily plan API error:', error)

    const aiFailure = aiErrorResponse(error)
    if (aiFailure) return aiFailure

    return NextResponse.json({ error: 'Failed to generate daily plan' }, { status: 500 })
  }
}

// GET - retrieve today's plan or ask "what should I focus on?"
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await loadDailyPlan(supabase, user.id, await userToday(supabase, user.id))

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        message: 'No plan for today. Generate one?',
      })
    }

    return NextResponse.json({
      success: true,
      plan,
    })

  } catch (error) {
    console.error('Get daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to get daily plan' },
      { status: 500 }
    )
  }
}
