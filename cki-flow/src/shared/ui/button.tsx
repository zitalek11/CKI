import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-accent)] text-white hover:brightness-105',
        secondary:
          'bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)]',
        ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]',
        danger: 'bg-[var(--color-danger)] text-white hover:brightness-105',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3 text-[13px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
