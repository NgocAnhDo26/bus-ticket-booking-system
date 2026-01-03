import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Base Layout (Preserved)
        'flex flex-col gap-6 overflow-hidden py-6 text-sm group/card',
        'has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4',

        // New Branding: Background & Effects
        'bg-white dark:bg-emerald-900/40 backdrop-blur-sm',
        'text-card-foreground', // You might want to change this to text-emerald-950 if using specific text colors

        // New Branding: Border & Radius
        'rounded-3xl border border-emerald-100 dark:border-emerald-800',

        // New Branding: Shadows
        'shadow-xl shadow-emerald-900/5 dark:shadow-black/20',

        // Image Handling (Updated to 3xl to match container)
        '*:[img:first-child]:rounded-t-3xl *:[img:last-child]:rounded-b-3xl',

        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // Layout (Preserved)
        'grid auto-rows-min items-start gap-1 px-6 group-data-[size=sm]/card:px-4',
        'group/card-header @container/card-header',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',

        // Border Logic (Preserved)
        '[.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4',

        // Branding Updates (Updated to 3xl)
        'rounded-t-3xl',

        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-base leading-normal font-medium group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6 group-data-[size=sm]/card:px-4', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // Layout (Preserved)
        'flex items-center px-6 group-data-[size=sm]/card:px-4',
        '[.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4',

        // Branding Updates (Updated to 3xl)
        'rounded-b-3xl',

        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
