import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        // Layout
        'flex h-14 w-full items-center overflow-hidden rounded-2xl border-2 bg-white transition-all shadow-sm group/input-group',
        // Emerald Theme Base
        'border-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-50',
        // Focus States (triggered by children)
        'has-[[data-slot=input-group-control]:focus-visible]:border-emerald-400 has-[[data-slot=input-group-control]:focus-visible]:ring-4 has-[[data-slot=input-group-control]:focus-visible]:ring-emerald-100',
        'dark:has-[[data-slot=input-group-control]:focus-visible]:ring-emerald-900/50',
        // Error States
        'has-[[data-slot][aria-invalid=true]]:border-red-500 has-[[data-slot][aria-invalid=true]]:ring-red-200',
        // Alignment Logic (preserved from original)
        'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  'h-full flex items-center justify-center px-4 text-sm font-medium transition-colors select-none',
  {
    variants: {
      // Adjusted colors to match Emerald theme
      color: {
        default:
          'text-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-800/20 dark:text-emerald-400',
      },
      align: {
        'inline-start': 'border-r-2 border-emerald-100 dark:border-emerald-800/50',
        'inline-end': 'border-l-2 border-emerald-100 dark:border-emerald-800/50 order-last',
        'block-start':
          'w-full border-b-2 border-emerald-100 dark:border-emerald-800/50 justify-start py-2 h-auto',
        'block-end':
          'w-full border-t-2 border-emerald-100 dark:border-emerald-800/50 justify-start py-2 h-auto order-last',
      },
    },
    defaultVariants: {
      align: 'inline-start',
      color: 'default',
    },
  },
);

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      // Focus the input when clicking the addon
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }

        e.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      {...props}
    />
  );
}

// Button variants inside group - slight tweak to hover states
const inputGroupButtonVariants = cva(
  'gap-2 text-sm shadow-none flex items-center text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-100',
  {
    variants: {
      size: {
        xs: 'h-8 px-3 rounded-lg mr-1', // slightly larger touch target
        sm: 'h-10 px-3',
        'icon-xs':
          'size-8 rounded-lg p-0 hover:bg-emerald-100/50 dark:hover:bg-emerald-800/50 mr-1',
        'icon-sm': 'size-10 p-0',
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  },
);

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "text-muted-foreground gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input-group-control"
      className={cn(
        // Remove individual borders/radius as the Group container handles it
        'flex-1 bg-transparent px-4 py-4 text-base outline-none md:text-sm',
        'placeholder:text-emerald-300 dark:placeholder:text-emerald-600',
        'w-full min-w-0',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'flex-1 resize-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0',
        'text-emerald-900 dark:text-emerald-50 placeholder:text-emerald-300',
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
