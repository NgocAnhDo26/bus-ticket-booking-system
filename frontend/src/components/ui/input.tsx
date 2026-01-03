import * as React from 'react';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon | React.ElementType;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {Icon && (
          <Icon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 group-focus-within:text-emerald-600 dark:text-emerald-400/50 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none"
            size={20}
          />
        )}
        <input
          type={type}
          className={cn(
            // Base Layout
            'flex w-full border-2 bg-transparent transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium',
            // Sizing & Radius
            'h-14 rounded-2xl py-4 pr-4 text-base md:text-sm',
            // Icon Logic (Padding)
            Icon ? 'pl-12' : 'pl-4',
            // Emerald Theme (Light)
            'border-emerald-100 bg-white text-emerald-900 placeholder:text-emerald-300',
            'focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100',
            // Emerald Theme (Dark)
            'dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-50 dark:placeholder:text-emerald-600 dark:focus-visible:ring-emerald-900/50',
            // Hover & Shadow effects
            'shadow-sm group-hover:shadow-md',
            // States
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Error States (keeping red for semantic meaning, blending with emerald)
            'aria-invalid:border-red-500 aria-invalid:ring-red-200 dark:aria-invalid:ring-red-900/50',
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
