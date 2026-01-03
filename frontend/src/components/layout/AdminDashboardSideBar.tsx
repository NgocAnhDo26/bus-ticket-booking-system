import * as React from 'react';
import { Link } from 'react-router-dom';

import { Bus } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useNav } from '@/hooks/useNav';
import { cn } from '@/lib/utils';

export function AdminDashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { adminNavItems, userData } = useNav();

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
        <NavMain items={adminNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
