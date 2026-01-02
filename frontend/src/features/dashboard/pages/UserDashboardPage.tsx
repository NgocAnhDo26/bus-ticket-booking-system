import { useSearchParams } from 'react-router-dom';

import { toast } from 'sonner';

import { BookingHistoryPage } from '@/features/booking/pages/BookingHistoryPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { useTripStatusUpdates } from '@/hooks/useTripStatusUpdates';

import { DashboardPage } from './DashboardPage';

export function UserDashboardPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  // Subscribe to real-time trip status updates
  useTripStatusUpdates((statusUpdate) => {
    // Show toast notification based on status
    if (statusUpdate.status === 'CANCELLED') {
      toast.error('Chuyến xe bị hủy', {
        description: statusUpdate.message,
      });
    } else if (statusUpdate.status === 'DELAYED') {
      toast.warning('Chuyến xe bị hoãn', {
        description: statusUpdate.message,
      });
    } else if (statusUpdate.status === 'BOARDING') {
      toast.info('Đang lên xe', {
        description: statusUpdate.message,
      });
    } else if (statusUpdate.status === 'DEPARTED') {
      toast.info('Chuyến xe đã khởi hành', {
        description: statusUpdate.message,
      });
    }
  });

  return (
    <>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'profile' && <ProfilePage />}
      {activeTab === 'tickets' && <BookingHistoryPage />}
    </>
  );
}
