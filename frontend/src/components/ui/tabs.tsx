'use client';

import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-full p-1.5 text-emerald-600 dark:text-emerald-400/70 transition-all',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-100/50 dark:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800',
        line: 'bg-transparent gap-4 p-0 rounded-none',
      },
      size: {
        default: 'h-12',
        sm: 'h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Default Variant Styles
        'data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800',
        'data-[state=active]:text-emerald-950 dark:data-[state=active]:text-emerald-50',
        'data-[state=active]:shadow-[0_2px_10px_-2px_rgba(6,95,70,0.15)] dark:data-[state=active]:shadow-none',
        'hover:text-emerald-900 dark:hover:text-emerald-200',

        // Handling "Line" variant via group-data context from List
        'group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-2 group-data-[variant=line]/tabs-list:py-3',
        'group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none',
        'group-data-[variant=line]/tabs-list:data-[state=active]:border-b-4 group-data-[variant=line]/tabs-list:data-[state=active]:border-emerald-400',
        'group-data-[variant=line]/tabs-list:hover:text-emerald-600',

        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
