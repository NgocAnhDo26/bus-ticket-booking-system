import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UserSummaryCardProps {
  title: string;
  data: string | number;
  icon: LucideIcon;
  iconBgColor: string;
}

export const UserSummaryCard = ({ title, data, icon: Icon, iconBgColor }: UserSummaryCardProps) => {
  return (
    <Card className="flex-1 min-w-[250px] shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('p-2 rounded-full', iconBgColor)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data}</div>
      </CardContent>
    </Card>
  );
};
