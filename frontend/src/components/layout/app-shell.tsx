import { type ReactNode } from 'react';

import { SidebarNav } from './sidebar-nav';
import { TopBar } from './top-bar';

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background text-text-base">
      <div className="flex">
        <SidebarNav />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-6 py-6 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
};
