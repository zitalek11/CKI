import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
  accent: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
  success: 'bg-[color-mix(in_oklab,var(--color-success)_16%,transparent)] text-[var(--color-success)]',
  warning: 'bg-[color-mix(in_oklab,var(--color-warning)_16%,transparent)] text-[var(--color-warning)]',
  danger: 'bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] text-[var(--color-danger)]',
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        toneClass[tone],
        className,
      )}
      {...props}
    />
  )
}
