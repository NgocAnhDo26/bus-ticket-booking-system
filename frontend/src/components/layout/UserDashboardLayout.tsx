import { Outlet } from 'react-router-dom';

import { SimpleUserSidebar } from './SimpleUserSidebar';

export const UserDashboardLayout = () => (
  <div className="flex min-h-screen">
    <SimpleUserSidebar />
    <main className="flex flex-1 justify-center p-8">
      <Outlet />
    </main>
  </div>
);
