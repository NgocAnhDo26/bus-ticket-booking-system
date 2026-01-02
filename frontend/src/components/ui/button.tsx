import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-800 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-[0_4px_0_rgb(6,95,70)] hover:shadow-[0_6px_0_rgb(6,95,70)] hover:-translate-y-1 active:shadow-none active:translate-y-[4px] pb-[calc(0.5rem+2px)] active:pb-2', // Added padding bottom calculation to account for 3D shift
        destructive:
          'bg-red-100 text-red-900 hover:bg-red-200 border-2 border-transparent shadow-sm hover:shadow-md',
        outline:
          'border-2 border-emerald-900/10 bg-transparent text-emerald-900 hover:bg-emerald-50 hover:border-emerald-400 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-900',
        secondary:
          'bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-emerald-800 dark:text-emerald-100 dark:hover:bg-emerald-700 hover:-translate-y-1 shadow-sm',
        ghost:
          'text-emerald-800 hover:bg-emerald-100/50 dark:text-emerald-200 dark:hover:bg-emerald-800/50',
        link: 'text-emerald-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-3 text-base', // Chunkier default
        xs: 'h-8 px-3 text-xs',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-12 w-12',
        'icon-xs': 'h-8 w-8',
        'icon-sm': 'h-10 w-10',
        'icon-lg': 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
