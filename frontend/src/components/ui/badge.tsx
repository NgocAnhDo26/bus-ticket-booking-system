import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning'
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variantClass = {
    default: 'bg-muted text-text-base',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[variant]

  return (
    <span
      className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', variantClass, className)}
      {...props}
    />
  )
}

