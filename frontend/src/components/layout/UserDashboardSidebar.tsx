import { Link, useLocation } from 'react-router-dom';

import { Bus, LayoutDashboard, Search, Ticket, User } from 'lucide-react';

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
      url: '/dashboard?tab=dashboard',
      icon: LayoutDashboard,
      isActive:
        location.pathname === '/dashboard' &&
        (!location.search ||
          location.search === '?tab=dashboard' ||
          !location.search.includes('tab=')),
      isCollapsible: false,
    },
    {
      title: 'Hồ sơ',
      url: '/dashboard?tab=profile',
      icon: User,
      isActive: location.pathname === '/dashboard' && location.search.includes('tab=profile'),
      isCollapsible: false,
    },
    {
      title: 'Vé của tôi',
      url: '/dashboard?tab=tickets',
      icon: Ticket,
      isActive: location.pathname === '/dashboard' && location.search.includes('tab=tickets'),
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
          className={cn('flex items-center gap-2 p-2 group', isCollapsed && 'justify-center')}
        >
          <div className="bg-emerald-400 p-2 rounded-sm text-emerald-950 rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-400/20 shrink-0">
            <Bus size={20} strokeWidth={2.5} />
          </div>
          <span
            className={cn(
              'text-xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight overflow-hidden text-ellipsis text-nowrap',
              isCollapsed && 'hidden',
            )}
          >
            SwiftRide<span className="text-emerald-400">.</span>
          </span>
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
