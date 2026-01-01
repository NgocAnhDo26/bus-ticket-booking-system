import { useMemo, useState } from 'react';

import { Banknote, Bus, Ticket, Users } from 'lucide-react';

import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
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

type RangeKey = '7d' | '30d' | '90d';

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminDashboardPage = () => {
  const [range, setRange] = useState<RangeKey>('30d');
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics();

  // Important: keep from/to stable across renders, otherwise React Query treats it as a new queryKey and refetches nonstop.
  const { from, to } = useMemo(() => {
    const now = new Date();
    const to = now.toISOString();
    const d = new Date(now);
    if (range === '7d') d.setDate(d.getDate() - 7);
    if (range === '30d') d.setDate(d.getDate() - 30);
    if (range === '90d') d.setDate(d.getDate() - 90);
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
    limit: 5,
  });
  const { data: topOperators, isLoading: isLoadingTopOperators } = useAdminTopOperators({
    from,
    to,
    limit: 5,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useAdminRecentTransactions({
    limit: 10,
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbPage>Tổng quan</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="7d">7 ngày</TabsTrigger>
              <TabsTrigger value="30d">30 ngày</TabsTrigger>
              <TabsTrigger value="90d">90 ngày</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const header = 'date,revenue\n';
                const rows =
                  revenue
                    ?.map((r) => `${(r.date ?? '').replaceAll(',', ' ')},${r.revenue ?? 0}`)
                    .join('\n') ?? '';
                downloadCsv(`revenue_${range}.csv`, header + rows + '\n');
              }}
              disabled={!revenue?.length}
            >
              Export doanh thu (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const header = 'bucket,totalBookings,confirmedBookings\n';
                const rows =
                  bookingTrends
                    ?.map(
                      (r) =>
                        `${(r.bucket ?? '').replaceAll(',', ' ')},${r.totalBookings ?? 0},${r.confirmedBookings ?? 0}`,
                    )
                    .join('\n') ?? '';
                downloadCsv(`booking_trends_${range}.csv`, header + rows + '\n');
              }}
              disabled={!bookingTrends?.length}
            >
              Export xu hướng (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const header = 'id,passengerName,route,totalPrice,status,bookingTime\n';
                const rows =
                  transactions
                    ?.map(
                      (t) =>
                        `${String(t.id ?? '').replaceAll(',', ' ')},${String(t.passengerName ?? '').replaceAll(',', ' ')},${String(t.route ?? '').replaceAll(',', ' ')},${t.totalPrice ?? 0},${String(t.status ?? '')},${String(t.bookingTime ?? '')}`,
                    )
                    .join('\n') ?? '';
                downloadCsv(`transactions_${range}.csv`, header + rows + '\n');
              }}
              disabled={!transactions?.length}
            >
              Export giao dịch (CSV)
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <AdminSummaryCard
            title="Tổng doanh thu ngày"
            data={
              isLoadingMetrics ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                formatCurrency(metrics?.todayRevenue ?? 0)
              )
            }
            icon={Banknote}
            iconBgColor="bg-sky-400"
          />
          <AdminSummaryCard
            title="Vé bán ra"
            data={
              isLoadingMetrics ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                formatNumber(metrics?.todayTicketsSold ?? 0)
              )
            }
            icon={Ticket}
            iconBgColor="bg-emerald-400"
          />
          <AdminSummaryCard
            title="Tổng nhà xe hoạt động"
            data={
              isLoadingMetrics ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                formatNumber(metrics?.todayActiveOperators ?? 0)
              )
            }
            icon={Bus}
            iconBgColor="bg-purple-400"
          />
          <AdminSummaryCard
            title="Người dùng mới"
            data={
              isLoadingMetrics ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                formatNumber(metrics?.todayNewUsers ?? 0)
              )
            }
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <RevenueChart data={revenue} isLoading={isLoadingRevenue} />
          <BookingTrendsChart data={bookingTrends} isLoading={isLoadingTrends} />
          <TopRoutesTable routes={topRoutes} isLoading={isLoadingTopRoutes} />
          <MostActiveOperators operators={topOperators ?? []} isLoading={isLoadingTopOperators} />
        </div>
        {isLoadingTransactions ? (
          <div className="rounded-md border p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <RecentTransactionsList transactions={transactions || []} />
        )}
      </div>
    </>
  );
};
