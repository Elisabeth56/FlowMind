import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, profile })
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Only preference fields are writable here — tier, usage counters and
    // Paystack identifiers are owned by the payment webhook.
    const updates: {
      full_name?: string
      timezone?: string
      daily_plan_time?: string
      weekly_summary_day?: number
    } = {}

    if (typeof body.full_name === 'string') {
      const fullName = body.full_name.trim()
      if (fullName.length > 120) {
        return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
      }
      updates.full_name = fullName
    }

    if (typeof body.timezone === 'string' && body.timezone) {
      updates.timezone = body.timezone
    }

    if (typeof body.daily_plan_time === 'string') {
      if (!TIME_PATTERN.test(body.daily_plan_time)) {
        return NextResponse.json(
          { error: 'daily_plan_time must be in HH:MM format' },
          { status: 400 }
        )
      }
      updates.daily_plan_time = body.daily_plan_time
    }

    if (typeof body.weekly_summary_day === 'number') {
      if (!Number.isInteger(body.weekly_summary_day) || body.weekly_summary_day < 0 || body.weekly_summary_day > 6) {
        return NextResponse.json(
          { error: 'weekly_summary_day must be 0-6' },
          { status: 400 }
        )
      }
      updates.weekly_summary_day = body.weekly_summary_day
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, profile })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
