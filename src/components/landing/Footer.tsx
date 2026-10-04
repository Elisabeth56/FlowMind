import { Logo } from '@/components/ui'

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
      { label: 'Email', href: 'mailto:hello@elisabethnnamani.dev' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 border-t border-hairline px-6 pt-12">
      <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-[32ch] text-small text-ink-3">A calm place for everything you meant to get to.</p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col gap-2.5 text-small">
            <span className="text-ink-3">{group.title}</span>
            {group.links.map((link) => (
              <a key={link.label} href={link.href} className="self-start text-ink underline-offset-4 hover:underline">
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <p className="text-caption text-ink-3">© {new Date().getFullYear()} FlowMind</p>
    </footer>
  )
}
