import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Users } from "lucide-react";
import { AdminSummaryCard } from "../components/AdminSummaryCard";
import { RecentTransactionsList } from "../components/RecentTransactionsList";

export const AdminDashboardPage = () => {
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
            data="1,234"
            icon={Users}
            iconBgColor="bg-sky-400"
          />
          <AdminSummaryCard
            title="Vé bán ra"
            data="56"
            icon={Users}
            iconBgColor="bg-emerald-400"
          />
          <AdminSummaryCard
            title="Tổng nhà xe hoạt động"
            data="1,234"
            icon={Users}
            iconBgColor="bg-purple-400"
          />
          <AdminSummaryCard
            title="Người dùng mới"
            data="1,234"
            icon={Users}
            iconBgColor="bg-orange-400"
          />
        </div>
        <RecentTransactionsList />
      </div>
    </>
  );
};
