import Link from 'next/link'
import { ButtonLink, Logo } from '@/components/ui'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-4 text-center text-ink">
      <Link href="/">
        <Logo />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">Nothing at this address</h1>
        <p className="text-body text-ink-2">The page may have moved, or the link was mistyped.</p>
      </div>
      <ButtonLink href="/dash">Go to your inbox</ButtonLink>
    </main>
  )
}
