import { Link, NavLink } from 'react-router-dom';

import { Bus, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNav } from '@/hooks/useNav';
import { useAuthStore } from '@/store/auth-store';

export const SidebarNav = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { userNavItems, user } = useNav();

  return (
    <aside className="hidden w-64 border-r border-border/60 bg-surface/80 px-6 py-8 lg:block">
      <div className="mb-8 space-y-1">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-400 p-2 rounded-sm text-emerald-950 rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-400/20">
            <Bus size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">
            SwiftRide<span className="text-emerald-400">.</span>
          </span>
        </Link>
        <p className="text-sm text-text-muted pt-2">
          {user?.role === 'ADMIN' ? 'Admin' : 'Passenger'} view
        </p>
      </div>
      <nav className="space-y-2">
        {userNavItems.map(({ to, label, icon: Icon, disabled }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-input px-3 py-2 text-sm font-medium transition',
                disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted/60',
                isActive ? 'bg-muted text-primary' : 'text-text-base',
              ].join(' ')
            }
            aria-disabled={disabled}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-10">
        <Button variant="outline" size="lg" className="w-full" onClick={clearAuth}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};
