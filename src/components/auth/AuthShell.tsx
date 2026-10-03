import Link from 'next/link'
import { Logo } from '@/components/ui/Mark'

/** The frame shared by the small auth pages: logo, a heading, one form. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-12 inline-flex">
          <Logo />
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-8">{description}</p>

        {children}
      </div>
    </div>
  )
}

export function AuthNotice({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mb-6 p-4 rounded-xl text-sm border ${
        kind === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      {children}
    </div>
  )
}

export const authInputClass =
  'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 focus:bg-white transition-all'

export const authButtonClass =
  'w-full py-3.5 bg-azure-500 text-white font-semibold rounded-xl hover:bg-azure-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
