import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ActivityItem } from "../types";

const badgeVariantMap: Record<
  ActivityItem["status"],
  "success" | "warning" | "default"
> = {
  success: "success",
  warning: "warning",
  info: "default",
};

type ActivityListProps = {
  data: ActivityItem[];
};

export const ActivityList = ({ data }: ActivityListProps) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>Recent activity</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {data.map((item) => (
        <div key={item.id} className="rounded-card border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{item.title}</p>
            <Badge variant={badgeVariantMap[item.status]}>{item.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">{item.description}</p>
          <p className="text-xs text-text-muted">{item.timestamp}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);
