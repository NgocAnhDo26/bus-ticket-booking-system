import { NavLink } from 'react-router-dom';

import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNav } from '@/hooks/useNav';
import { useAuthStore } from '@/store/auth-store';

export const SidebarNav = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { userNavItems, user } = useNav();

  return (
    <aside className="hidden w-64 border-r border-border/60 bg-surface/80 px-6 py-8 lg:block">
      <div className="mb-8 space-y-1">
        <p className="type-h3">SwiftRide</p>
        <p className="text-sm text-text-muted">
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
