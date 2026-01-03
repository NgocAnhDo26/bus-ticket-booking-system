import { Bell } from 'lucide-react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export const TopBar = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm text-text-muted">Chào mừng trở lại</p>
        <p className="text-lg font-semibold text-text-base">{user?.fullName ?? 'Hành khách'}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
          {(user?.fullName ?? 'P')[0]}
        </div>
      </div>
    </header>
  );
};
