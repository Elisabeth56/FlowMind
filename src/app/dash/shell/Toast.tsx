'use client'

import { useApp } from '../AppProvider'

/** What just happened, with a way back. Used instead of "are you sure?" dialogs. */
export function Toast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null
  return (
    <div
      role="status"
      key={toast.id}
      className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-small text-bg shadow-soft md:bottom-8"
    >
      {toast.message}
      {toast.undo ? (
        <button
          type="button"
          onClick={() => {
            toast.undo?.()
            dismissToast()
          }}
          className="min-h-9 rounded-full bg-bg/15 px-3.5 font-medium"
        >
          Undo
        </button>
      ) : (
        <span className="w-3" />
      )}
    </div>
  )
}
