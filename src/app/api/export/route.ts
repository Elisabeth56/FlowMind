import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Everything a user owns, as JSON. RLS scopes each table to the caller, and
// the explicit user_id filters keep that true even if a policy is loosened.
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profile, inboxItems, projects, dailyPlans, weeklySummaries] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('inbox_items').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('daily_plans').select('*').eq('user_id', user.id).order('plan_date'),
      supabase.from('weekly_summaries').select('*').eq('user_id', user.id).order('week_start'),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      inbox_items: inboxItems.data ?? [],
      projects: projects.data ?? [],
      daily_plans: dailyPlans.data ?? [],
      weekly_summaries: weeklySummaries.data ?? [],
    }

    const filename = `flowmind-export-${payload.exported_at.split('T')[0]}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export your data' }, { status: 500 })
  }
}
