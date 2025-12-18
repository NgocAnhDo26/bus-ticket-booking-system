import { useMemo } from 'react';

import {
  BusFront,
  LayoutDashboard,
  type LucideIcon,
  Search,
  Settings2,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { type UserRole } from '@/types/user';

// Admin navigation item type (for AdminDashboardSideBar)
export type AdminNavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isCollapsible: boolean;
  items?: {
    title: string;
    url: string;
  }[];
  // Roles that can access this menu item
  allowedRoles?: UserRole[];
};

// Regular user navigation item type (for SidebarNav)
export type UserNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

// All available admin menu items
const allAdminNavItems: AdminNavItem[] = [
  {
    title: 'Tổng quan',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
    isActive: true,
    isCollapsible: false,
    // Both ADMIN and STAFF can see dashboard
  },
  {
    title: 'Vận tải',
    url: '#',
    icon: BusFront,
    isCollapsible: true,
    items: [
      {
        title: 'Bến xe',
        url: '/admin/catalog/stations',
      },
      {
        title: 'Nhà xe',
        url: '/admin/catalog/operators',
      },
      {
        title: 'Xe',
        url: '/admin/catalog/buses',
      },
      {
        title: 'Sơ đồ xe',
        url: '/admin/catalog/layouts',
      },
      {
        title: 'Tuyến đường',
        url: '/admin/catalog/routes',
      },
      {
        title: 'Chuyến đi',
        url: '/admin/catalog/trips',
      },
    ],
    // Both ADMIN and STAFF can see transport
  },
  {
    title: 'Đặt vé',
    url: '#',
    icon: Ticket,
    isCollapsible: true,
    items: [
      {
        title: 'Danh sách đặt chỗ',
        url: '/admin/bookings/list',
      },
      {
        title: 'Giao dịch thanh toán',
        url: '/admin/bookings/transactions',
      },
    ],
    // Both ADMIN and STAFF can see bookings
  },
  {
    title: 'Người dùng',
    url: '/admin/users',
    icon: Users,
    isCollapsible: true,
    items: [
      {
        title: 'Khách hàng',
        url: '/admin/users/customers',
      },
      {
        title: 'Nhân viên',
        url: '/admin/users/staffs',
      },
    ],
    // Only ADMIN can see user management
    allowedRoles: ['ADMIN'],
  },
  {
    title: 'Phản hồi',
    url: '/admin/feedbacks',
    icon: Sparkles,
    isCollapsible: false,
    // Both ADMIN and STAFF can see feedbacks
  },
  {
    title: 'Cấu hình',
    url: '#',
    icon: Settings2,
    isCollapsible: false,
    // Only ADMIN can see configuration
    allowedRoles: ['ADMIN'],
  },
];

// Filter admin menu items based on user role
const filterAdminNavItemsByRole = (
  items: AdminNavItem[],
  role: UserRole | null,
): AdminNavItem[] => {
  if (!role) return [];

  return items.filter((item) => {
    // If no allowedRoles specified, all roles can access (default behavior)
    if (!item.allowedRoles) return true;
    // Otherwise, check if user's role is in the allowed roles
    return item.allowedRoles.includes(role);
  });
};

// Get regular user navigation items
const getUserNavItems = (userRole: UserRole | null): UserNavItem[] => {
  const isAdmin = userRole === 'ADMIN';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
  const sectionPrefix = isAdmin ? '/admin' : '/dashboard';

  return [
    { to: dashboardPath, label: 'Dashboard', icon: LayoutDashboard },
    {
      to: `${sectionPrefix}/trips`,
      label: 'Trips',
      icon: Search,
      disabled: true,
    },
    {
      to: `${sectionPrefix}/bookings`,
      label: 'Bookings',
      icon: Ticket,
      disabled: true,
    },
  ];
};

export const useNav = () => {
  const user = useAuthStore((state) => state.user);

  // Filter admin nav items based on role
  const adminNavItems = useMemo(() => {
    return filterAdminNavItemsByRole(allAdminNavItems, user?.role || null);
  }, [user?.role]);

  // Get regular user nav items
  const userNavItems = useMemo(() => {
    return getUserNavItems(user?.role || null);
  }, [user?.role]);

  // Prepare user data for NavUser component
  const userData = useMemo(() => {
    if (user) {
      return {
        name: user.fullName,
        email: user.email,
        avatar: user.avatarUrl || '/avatars/default.jpg',
      };
    }
    return {
      name: 'Guest',
      email: '',
      avatar: '/avatars/default.jpg',
    };
  }, [user]);

  return {
    adminNavItems,
    userNavItems,
    userData,
    user,
  };
};
