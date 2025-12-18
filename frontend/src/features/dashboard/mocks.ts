import { type DashboardResponse } from './types';

export const getMockDashboard = (): DashboardResponse => ({
  summary: [
    {
      label: 'Total Bookings',
      value: '1,248',
      trend: '+12% vs last week',
      trendDirection: 'up',
    },
    {
      label: 'Seat Occupancy',
      value: '84%',
      trend: '+4% vs avg',
      trendDirection: 'up',
    },
    {
      label: 'Revenue',
      value: '₫1.2B',
      trend: '-3% vs last week',
      trendDirection: 'down',
    },
  ],
  activity: [
    {
      id: '1',
      title: 'Booking confirmed',
      timestamp: '10 min ago',
      description: 'Passenger secured 2 seats SG → HN',
      status: 'success',
    },
    {
      id: '2',
      title: 'Seat map updated',
      timestamp: '35 min ago',
      description: 'Admin adjusted VIP prices for FUTA',
      status: 'info',
    },
    {
      id: '3',
      title: 'Payment pending',
      timestamp: '1 hr ago',
      description: 'Awaiting MoMo confirmation for #BK-9841',
      status: 'warning',
    },
  ],
  roleWidgets: {
    title: 'Upcoming operations',
    items: [
      { label: 'Trips today', value: '32', helper: '5 delayed' },
      { label: 'Open seats', value: '210', helper: 'Across 7 operators' },
      { label: 'Refund requests', value: '8', helper: 'SLA: 2h avg' },
    ],
  },
});
