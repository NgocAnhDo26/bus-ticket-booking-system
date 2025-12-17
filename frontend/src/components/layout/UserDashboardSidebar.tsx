import { Link, useLocation } from 'react-router-dom';

import { LayoutDashboard, Search, Ticket, Tickets } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useNav } from '@/hooks/useNav';
import { cn } from '@/lib/utils';

export function UserDashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { userData } = useNav();
  const location = useLocation();

  const userNavItems = [
    {
      title: 'Tổng quan',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/dashboard',
      isCollapsible: false,
    },
    {
      title: 'Vé của tôi',
      url: '/dashboard/bookings',
      icon: Ticket,
      isActive: location.pathname === '/dashboard/bookings',
      isCollapsible: false,
    },
    {
      title: 'Đặt vé',
      url: '/',
      icon: Search,
      isActive: location.pathname === '/',
      isCollapsible: false,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          to="/"
          className={cn('flex items-center gap-3 font-medium p-2', isCollapsed && 'justify-center')}
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md shrink-0">
            <Tickets className="size-5" />
          </div>
          <p
            className={cn(
              'text-xl font-semibold overflow-hidden text-ellipsis text-nowrap',
              isCollapsed && 'hidden',
            )}
          >
            SwiftRide
          </p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={userNavItems} />
      </SidebarContent>
      <SidebarFooter>
        {userData ? (
          <NavUser user={userData} />
        ) : (
          <div className="p-2">
            <Link
              to="/login"
              className="flex w-full items-center gap-2 rounded-md border p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <span>Đăng nhập</span>
            </Link>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
