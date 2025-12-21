import { Outlet } from 'react-router-dom';

import { PublicHeader } from './PublicHeader';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
