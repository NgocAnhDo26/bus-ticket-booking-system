export type SummaryMetric = {
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
};

export type ActivityItem = {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  status: "success" | "warning" | "info";
};

export type DashboardResponse = {
  summary: SummaryMetric[];
  activity: ActivityItem[];
  roleWidgets: {
    title: string;
    items: Array<{ label: string; value: string; helper?: string }>;
  };
};
