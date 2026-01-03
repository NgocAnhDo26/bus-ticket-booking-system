import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles: rounded-full, bold, transition logic
  'cursor-pointer disabled:pointer-events-none relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-800 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary: Emerald 400 bg, Dark Text, Dark Green Shadow
        default:
          'bg-emerald-400 text-emerald-950 shadow-[0_4px_0_rgb(6,95,70)] hover:bg-emerald-300 hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(6,95,70)] active:translate-y-[4px] active:shadow-none',

        // Secondary: Orange/Cream theme
        secondary:
          'bg-orange-100 text-orange-900 shadow-sm hover:bg-orange-200 hover:-translate-y-1 dark:bg-emerald-800 dark:text-emerald-100 dark:hover:bg-emerald-700',

        // Outline: Emerald borders
        outline:
          'border-2 border-emerald-900/10 bg-transparent text-emerald-900 hover:bg-emerald-50 hover:border-emerald-400 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-900',

        // Ghost
        ghost:
          'text-emerald-800 hover:bg-emerald-100/50 dark:text-emerald-200 dark:hover:bg-emerald-800/50',

        destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-[0_4px_0_rgb(153,27,27)]',

        // Link: text-only button style
        link: 'text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400',
      },
      size: {
        default: 'h-12 px-6 py-3', // Taller than standard Shadcn
        sm: 'h-9 px-4',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
