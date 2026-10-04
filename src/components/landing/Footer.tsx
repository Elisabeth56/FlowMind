import { DemoButton } from '@/components/auth/DemoButton'
import { Logo, ThemeToggle } from '@/components/ui'

const GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how' },
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: 'https://github.com/Elisabeth56/FlowMind#readme' },
      { label: 'Contact', href: 'mailto:hello@elisabethnnamani.dev' },
    ],
  },
  {
    title: 'Elsewhere',
    links: [
      { label: 'GitHub', href: 'https://github.com/Elisabeth56/FlowMind' },
      { label: 'Elisabeth Nnamani', href: 'https://elisabethnnamani.dev' },
    ],
  },
]

/** A soft panel that ends the page: links, one more way into the demo, and the name writ large. */
export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1200px] px-6">
      <div data-seen className="ft relative flex flex-col gap-12 overflow-hidden rounded-[32px] bg-surface px-6 pt-10 md:px-12 md:pt-12">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="max-w-[30ch] text-body text-ink-2">A calm place for everything you meant to get to.</p>
            <DemoButton size="sm" />
          </div>
          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-2.5 text-small">
              <span className="text-ink-3">{group.title}</span>
              {group.links.map((link) => (
                <a key={link.label} href={link.href} className="ft-link self-start text-ink">
                  {link.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 text-caption text-ink-3">
          <span>© {new Date().getFullYear()} FlowMind</span>
          <span className="flex items-center gap-1">
            <a href="#top" className="ft-link text-ink-2">
              Back to top
            </a>
            <ThemeToggle />
          </span>
        </div>

        {/* the name, large and quiet; each letter rises as the footer scrolls in and lifts under the pointer */}
        <p aria-hidden="true" className="ft-word">
          {'FlowMind'.split('').map((letter, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
