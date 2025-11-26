import { Outlet } from "react-router-dom";
import { AppShell } from "./app-shell";

export const DashboardLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);
