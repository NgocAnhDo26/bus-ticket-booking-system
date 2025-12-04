import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Users, Banknote, Ticket, Bus } from "lucide-react";
import { AdminSummaryCard } from "../components/AdminSummaryCard";
import { RecentTransactionsList } from "../components/RecentTransactionsList";
import {
  useAdminMetrics,
  useAdminRecentTransactions,
} from "../hooks";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

export const AdminDashboardPage = () => {
  const { data: metrics } = useAdminMetrics();
  const { data: transactions } = useAdminRecentTransactions();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-muted/50">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbPage>Tổng quan</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/50">
        <div className="flex flex-wrap gap-4">
          <AdminSummaryCard
            title="Tổng doanh thu ngày"
            data={metrics ? formatCurrency(metrics.todayRevenue) : "..."}
            icon={Banknote}
            iconBgColor="bg-sky-400"
          />
          <AdminSummaryCard
            title="Vé bán ra"
            data={metrics ? formatNumber(metrics.todayTicketsSold) : "..."}
            icon={Ticket}
            iconBgColor="bg-emerald-400"
          />
          <AdminSummaryCard
            title="Tổng nhà xe hoạt động"
            data={metrics ? formatNumber(metrics.todayActiveOperators) : "..."}
            icon={Bus}
            iconBgColor="bg-purple-400"
          />
          <AdminSummaryCard
            title="Người dùng mới"
            data={metrics ? formatNumber(metrics.todayNewUsers) : "..."}
            icon={Users}
            iconBgColor="bg-orange-400"
          />
        </div>
        <RecentTransactionsList transactions={transactions || []} />
      </div>
    </>
  );
};
