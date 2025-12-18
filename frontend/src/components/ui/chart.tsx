import * as React from 'react';

import { cn } from '@/lib/utils';

type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn(
            'flex h-full flex-1 flex-col justify-between gap-2 rounded-lg border bg-card p-4',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </ChartContext.Provider>
    );
  },
);

ChartContainer.displayName = 'ChartContainer';

export const useChartConfig = () => {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error('useChartConfig must be used within a ChartContainer');
  return ctx.config;
};

export interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border bg-popover px-3 py-2 text-xs shadow-md shadow-black/5',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ChartTooltipContent.displayName = 'ChartTooltipContent';

export interface ChartLegendItem {
  id: string;
  label: string;
  colorClass?: string;
}

interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ChartLegendItem[];
}

export const ChartLegend = ({ items, className, ...props }: ChartLegendProps) => {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full bg-chart-1', item.colorClass)} />
          <span className="whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
