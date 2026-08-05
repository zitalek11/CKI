import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-[#12121f]/90 backdrop-blur', className)}>
      {children}
    </div>
  )
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'secondary' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40',
        variant === 'primary' && 'bg-violet-600 text-white hover:bg-violet-500',
        variant === 'secondary' && 'bg-white/8 text-white hover:bg-white/12 border border-white/10',
        variant === 'ghost' && 'bg-transparent text-[#b8b8e0] hover:bg-white/5 hover:text-white',
        variant === 'danger' && 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60 min-h-24',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <label className={cn('mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8b8bb8]', className)}>{children}</label>
}

export function Field({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <div className="mb-3">
      <Label>{label}</Label>
      {children}
      {hint ? <div className="mt-1 text-[11px] text-[#6060a0]">{hint}</div> : null}
    </div>
  )
}
