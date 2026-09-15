import { Info } from 'lucide-react'

/**
 * These preference screens have no backing columns on `profiles` yet, so
 * nothing they collect can be persisted. Saying so beats a Save button that
 * pretends to work.
 */
export default function NotYetSavedNotice({ what }: { what: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        {what} aren&apos;t stored yet — changes here apply to this session only and
        reset when you reload.
      </p>
    </div>
  )
}
