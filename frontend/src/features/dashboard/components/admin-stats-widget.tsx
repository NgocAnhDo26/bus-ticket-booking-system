import { ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";

export const AdminStatsWidget = () => {
  const user = useAuthStore((state) => state.user);

  // Only admins can see this widget
  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription className="text-amber-700">
              Administrative statistics and controls
            </CardDescription>
          </div>
          <Badge className="bg-amber-600 text-white">ADMIN ONLY</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-2xl font-semibold text-gray-900">1,284</p>
            <p className="text-xs text-gray-500">+12% from last week</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm font-medium text-gray-600">System Health</p>
            <p className="text-2xl font-semibold text-green-600">99.8%</p>
            <p className="text-xs text-gray-500">All services operational</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-700">Admin Actions</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li>• View system logs and audit trails</li>
            <li>• Manage user accounts and permissions</li>
            <li>• Configure payment processors</li>
            <li>• Review transactions and disputes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
