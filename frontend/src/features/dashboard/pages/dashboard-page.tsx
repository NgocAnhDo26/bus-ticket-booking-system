import { SummaryCards } from "../components/summary-cards";
import { ActivityList } from "../components/activity-list";
import { RoleWidget } from "../components/role-widget";
import { AdminStatsWidget } from "../components/admin-stats-widget";
import { useDashboard } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";

type DashboardPageProps = {
  variant?: "passenger" | "admin";
};

export const DashboardPage = ({ variant = "passenger" }: DashboardPageProps) => {
  const { data, isLoading } = useDashboard();
  const showAdminWidgets = variant === "admin";

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-text-muted">
          Loading dashboard…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <SummaryCards data={data.summary} />
      {showAdminWidgets && <AdminStatsWidget />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityList data={data.activity} />
        </div>
        <RoleWidget data={data.roleWidgets} />
      </div>
    </div>
  );
};
