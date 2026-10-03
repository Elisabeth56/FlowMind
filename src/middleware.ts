import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Only where a session matters. The landing page stays out of it, so a visitor's
// first load never waits on a call to the auth server.
export const config = {
  matcher: [
    '/dash/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    // API routes, except the Paystack webhook (it is authenticated by its signature)
    '/api/((?!webhooks).*)',
  ],
}
