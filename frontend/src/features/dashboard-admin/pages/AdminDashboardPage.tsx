import { useMemo, useState } from 'react';

import { Banknote, Bus, Ticket, Users } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AdminSummaryCard } from '../components/AdminSummaryCard';
import { BookingTrendsChart } from '../components/BookingTrendsChart';
import { ConversionRateCard } from '../components/ConversionRateCard';
import { MostActiveOperators } from '../components/MostActiveOperators';
import { RecentTransactionsList } from '../components/RecentTransactionsList';
import { RevenueChart } from '../components/RevenueChart';
import { TopRoutesTable } from '../components/TopRoutesTable';
import {
  useAdminBookingConversion,
  useAdminBookingTrends,
  useAdminMetrics,
  useAdminRecentTransactions,
  useAdminRevenue,
  useAdminTopOperators,
  useAdminTopRoutes,
} from '../hooks';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

type RangeKey = '1w' | '1m' | '1y';

export const AdminDashboardPage = () => {
  const [range, setRange] = useState<RangeKey>('1m');
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics();

  // Important: keep from/to stable across renders, otherwise React Query treats it as a new queryKey and refetches nonstop.
  const { from, to } = useMemo(() => {
    const now = new Date();
    const to = now.toISOString();
    const d = new Date(now);
    if (range === '1w') d.setDate(d.getDate() - 7);
    if (range === '1m') d.setDate(d.getDate() - 30);
    if (range === '1y') d.setDate(d.getDate() - 365);
    const from = d.toISOString();
    return { from, to };
  }, [range]);

  const { data: revenue, isLoading: isLoadingRevenue } = useAdminRevenue({ from, to });
  const { data: bookingTrends, isLoading: isLoadingTrends } = useAdminBookingTrends({
    from,
    to,
    groupBy: 'day',
  });
  const { data: conversion, isLoading: isLoadingConversion } = useAdminBookingConversion({
    from,
    to,
  });
  const { data: topRoutes, isLoading: isLoadingTopRoutes } = useAdminTopRoutes({
    from,
    to,
    limit: 10,
  });
  const { data: topOperators, isLoading: isLoadingTopOperators } = useAdminTopOperators({
    from,
    to,
    limit: 10,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useAdminRecentTransactions({
    limit: 10,
  });

  return (
    <section className="flex flex-col p-4 pt-0">
      <div className="flex flex-col gap-2 mt-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 pt-0">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card flex flex-wrap items-stretch gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs *:data-[slot=card]:w-full sm:*:data-[slot=card]:w-[calc(50%-0.5rem)] lg:*:data-[slot=card]:w-[calc(33.333%-0.666rem)] 2xl:*:data-[slot=card]:w-[calc(20%-0.8rem)] *:data-[slot=card]:flex-none">
          <AdminSummaryCard
            title="Tổng doanh thu ngày"
            data={formatCurrency(metrics?.todayRevenue ?? 0)}
            isLoading={isLoadingMetrics}
            icon={Banknote}
            iconBgColor="bg-sky-400"
          />
          <AdminSummaryCard
            title="Vé bán ra"
            data={formatNumber(metrics?.todayTicketsSold ?? 0)}
            isLoading={isLoadingMetrics}
            icon={Ticket}
            iconBgColor="bg-emerald-400"
          />
          <AdminSummaryCard
            title="Tổng nhà xe hoạt động"
            data={formatNumber(metrics?.todayActiveOperators ?? 0)}
            isLoading={isLoadingMetrics}
            icon={Bus}
            iconBgColor="bg-purple-400"
          />
          <AdminSummaryCard
            title="Người dùng mới"
            data={formatNumber(metrics?.todayNewUsers ?? 0)}
            isLoading={isLoadingMetrics}
            icon={Users}
            iconBgColor="bg-orange-400"
          />
          <ConversionRateCard
            isLoading={isLoadingConversion}
            conversionRate={conversion?.conversionRate}
            confirmed={conversion?.confirmed}
            total={conversion?.total}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-end">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="1w">Tuần</TabsTrigger>
              <TabsTrigger value="1m">Tháng</TabsTrigger>
              <TabsTrigger value="1y">Năm</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <RevenueChart data={revenue} isLoading={isLoadingRevenue} />
          <BookingTrendsChart data={bookingTrends} isLoading={isLoadingTrends} />
          <TopRoutesTable routes={topRoutes} isLoading={isLoadingTopRoutes} />
          <MostActiveOperators operators={topOperators ?? []} isLoading={isLoadingTopOperators} />
        </div>
        {isLoadingTransactions ? (
          <div className="rounded-md border p-6">
            <div className="space-y-3">
              <p className="font-medium mb-6">Giao dịch gần đây</p>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <RecentTransactionsList transactions={transactions || []} />
        )}
      </div>
    </section>
  );
};
