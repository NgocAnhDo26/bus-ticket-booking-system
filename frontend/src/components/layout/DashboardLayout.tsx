import { Outlet } from 'react-router-dom';

import { ChatWidget } from '@/features/ai-chat/components/ChatWidget';

import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
};
