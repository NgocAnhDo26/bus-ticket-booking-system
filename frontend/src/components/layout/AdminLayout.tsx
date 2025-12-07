import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AdminDashboardSidebar } from "./AdminDashboardSideBar";

export const AdminDashboardLayout = () => (
  <SidebarProvider>
    <AdminDashboardSidebar />
    <SidebarInset>
      <section className="pt-6 p-4">
        <Outlet />
      </section>
    </SidebarInset>
  </SidebarProvider>
);
