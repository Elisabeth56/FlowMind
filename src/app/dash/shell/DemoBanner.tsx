'use client'

import { useApp } from '../AppProvider'

/** Shown on every screen of the shared demo, so nobody mistakes it for their own account. */
export function DemoBanner() {
  const { isDemo, signOut } = useApp()
  if (!isDemo) return null
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-apricot-tint px-4 py-2.5 text-small text-ink md:px-12">
      <span>This is the shared demo. Other visitors see what you add, and it is cleared every night.</span>
      <button
        type="button"
        onClick={async () => {
          // the sign-up page sends signed-in visitors back to the app, so leave the demo first
          await signOut()
          window.location.assign('/signup')
        }}
        className="font-medium text-apricot-ink underline underline-offset-2"
      >
        Create your own account
      </button>
    </div>
  )
}
