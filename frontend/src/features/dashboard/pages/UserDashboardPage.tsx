import { useSearchParams } from 'react-router-dom';

import { BookingHistoryPage } from '@/features/booking/pages/BookingHistoryPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';

import { DashboardPage } from './DashboardPage';

export function UserDashboardPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'profile' && <ProfilePage />}
      {activeTab === 'tickets' && <BookingHistoryPage />}
    </>
  );
}
