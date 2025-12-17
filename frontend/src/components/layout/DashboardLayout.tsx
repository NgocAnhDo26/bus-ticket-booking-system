import { Outlet } from 'react-router-dom';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';

import { PublicHeader } from './PublicHeader';
import { UserDashboardSidebar } from './UserDashboardSidebar';

export const DashboardLayout = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <UserDashboardSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};
