import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, children, className, ...props }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
