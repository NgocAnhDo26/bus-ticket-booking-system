import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { type SummaryMetric } from '../types';

type SummaryCardsProps = {
  data: SummaryMetric[];
};

export const SummaryCards = ({ data }: SummaryCardsProps) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {data.map((metric) => {
      const isUp = metric.trendDirection === 'up';
      const Icon = isUp ? ArrowUpRight : ArrowDownRight;
      return (
        <Card key={metric.label}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{metric.value}</CardTitle>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
                  isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                )}
              >
                <Icon className="mr-1 h-3 w-3" />
                {metric.trend}
              </span>
            </div>
            <CardDescription>{metric.label}</CardDescription>
          </CardHeader>
        </Card>
      );
    })}
  </div>
);
