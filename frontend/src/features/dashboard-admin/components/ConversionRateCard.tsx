import { PercentIcon } from 'lucide-react';

import { AdminSummaryCard } from './AdminSummaryCard';

export interface ConversionRateCardProps {
  conversionRate?: number; // 0..1
  confirmed?: number;
  total?: number;
  isLoading?: boolean;
}

const formatPercent = (v: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(v);
};

export const ConversionRateCard = ({
  conversionRate,
  confirmed,
  total,
  isLoading,
}: ConversionRateCardProps) => {
  return (
    <AdminSummaryCard
      title="Tỷ lệ chuyển đổi đơn"
      icon={PercentIcon}
      iconBgColor="bg-red-400"
      isLoading={isLoading}
      data={
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatPercent(conversionRate ?? 0)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({confirmed ?? 0}/{total ?? 0} đơn đã xác nhận)
          </span>
        </div>
      }
    />
  );
};
