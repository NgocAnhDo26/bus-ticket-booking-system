import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export const FormField = ({ label, error, hint, children, className }: FormFieldProps) => (
  <div className={cn('space-y-2', className)}>
    <div className="space-y-1">
      <label className="text-sm font-medium text-text-base">{label}</label>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </div>
    {children}
    {error ? <p className="text-xs text-danger">{error}</p> : null}
  </div>
);
