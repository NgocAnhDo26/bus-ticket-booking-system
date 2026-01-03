import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[120px] w-full rounded-2xl border-2 border-emerald-100 bg-white px-4 py-3 text-base shadow-sm transition-all duration-200 placeholder:text-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:shadow-md hover:border-emerald-200', // JoyRide interaction
        'dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-50 dark:placeholder:text-emerald-600 dark:focus-visible:ring-emerald-900/50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
