import { type LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';

export interface AdminSummaryCardProps {
  title: string;
  data: string;
  icon: LucideIcon;
  iconBgColor?: string;
}

export const AdminSummaryCard = ({
  title,
  data,
  icon: Icon,
  iconBgColor,
}: AdminSummaryCardProps) => {
  return (
    <Card className="p-6 flex-1 min-w-64">
      <div className={`flex items-center justify-center p-2 rounded-xl size-12 ${iconBgColor}`}>
        <Icon className="text-white size-6" />
      </div>
      <div className="mt-4 space-y-1">
        <p>{title}</p>
        <p className="font-semibold text-xl">{data}</p>
      </div>
    </Card>
  );
};
