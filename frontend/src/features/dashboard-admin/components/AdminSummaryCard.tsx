import type { ReactNode } from 'react';

import { type LucideIcon } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface AdminSummaryCardProps {
  title: string;
  data: ReactNode;
  icon: LucideIcon;
  iconBgColor?: string;
  isLoading?: boolean;
}

export const AdminSummaryCard = ({
  title,
  data,
  icon: Icon,
  iconBgColor,
  isLoading,
}: AdminSummaryCardProps) => {
  return (
    <Card className="@container/card">
      <CardHeader>
        <div
          className={`flex items-center justify-center mb-2 p-2 rounded-xl size-12 ${iconBgColor}`}
        >
          <Icon className="text-white size-6" />
        </div>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {isLoading ? <Skeleton className="h-8 w-24" /> : data}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};
