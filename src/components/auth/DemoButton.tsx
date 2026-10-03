import { Button } from '@/components/ui'

type DemoButtonProps = Pick<React.ComponentProps<typeof Button>, 'variant' | 'size' | 'className'>

/** Signs the visitor into the shared demo account. A plain form post, so it works before any script loads. */
export function DemoButton({ variant = 'secondary', size, className }: DemoButtonProps) {
  return (
    <form action="/auth/demo" method="post" className="contents">
      <Button type="submit" variant={variant} size={size} className={className}>
        Try the demo
      </Button>
    </form>
  )
}
