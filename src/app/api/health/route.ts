import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - is the database answering? Pinged every few days by .github/workflows/keep-alive.yml,
// because Supabase pauses a free project after a week without activity and a paused
// database takes every sign-in down, the demo included. Reads no data: as a visitor,
// row level security returns nothing.
export async function GET() {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').select('id', { head: true }).limit(1)
  if (error) {
    console.error('Health check failed:', error.message)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
