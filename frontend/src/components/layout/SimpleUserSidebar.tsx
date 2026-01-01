import { Link, useLocation } from 'react-router-dom';

import { LayoutDashboard, Ticket, User } from 'lucide-react';

import { cn } from '@/lib/utils';

export function SimpleUserSidebar() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'dashboard';

  const navItems = [
    {
      title: 'Tổng quan',
      url: '/dashboard?tab=dashboard',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard',
    },
    {
      title: 'Hồ sơ',
      url: '/dashboard?tab=profile',
      icon: User,
      isActive: activeTab === 'profile',
    },
    {
      title: 'Vé của tôi',
      url: '/dashboard?tab=tickets',
      icon: Ticket,
      isActive: activeTab === 'tickets',
    },
  ];

  return (
    <aside className="w-64 border-r bg-muted/40 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Menu</h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                item.isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
