import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Bus, LogOut, Menu, Ticket, User, X } from 'lucide-react';

// Keep your existing imports
import { ThemeToggle } from '@/components/common/theme-toggle';
// Or replace with manual logic below
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth-store';

export const PublicHeader = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // Renamed from mobileMenuOpen to match new style

  const handleLogout = async () => {
    try {
      await logout(); // Clear refresh token cookie on server
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuth();
      navigate('/login');
      setIsOpen(false);
    }
  };

  // Common link styles from the new design
  const navLinkClass =
    'text-sm font-bold text-emerald-900/70 dark:text-emerald-100/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors';
  const mobileLinkClass =
    'font-bold text-emerald-900 dark:text-emerald-100 hover:text-emerald-600 transition-colors';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-lg border-b border-emerald-100 dark:border-emerald-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-400 p-2 rounded-sm text-emerald-950 rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-400/20">
            <Bus size={24} strokeWidth={2.5} />
          </div>
          {/* Kept "SwiftRide" name but used new design typography */}
          <span className="text-2xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">
            SwiftRide<span className="text-emerald-400">.</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={navLinkClass}>
            Trang chủ
          </Link>
          <Link to="/about" className={navLinkClass}>
            Giới thiệu
          </Link>
          <Link to="/search" className={navLinkClass}>
            Tìm chuyến
          </Link>
          <Link to="/booking/lookup" className={navLinkClass}>
            Tra cứu vé
          </Link>
          <Link to="/contact" className={navLinkClass}>
            Liên hệ
          </Link>

          {/* Theme Toggle */}
          {/* Note: I'm using your existing component to preserve logic. 
              If you want the specific Emerald button from the design, you'd need to expose `setTheme` here. */}
          <div className="scale-90">
            <ThemeToggle />
          </div>

          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900"
                >
                  <Avatar className="h-9 w-9 border-2 border-emerald-200 dark:border-emerald-800">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.fullName} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {user.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'PASSENGER' ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard?tab=profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" /> Hồ sơ của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard?tab=tickets" className="cursor-pointer">
                        <Ticket className="mr-2 h-4 w-4" /> Vé của tôi
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Hồ sơ của tôi
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/register">Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU (Replaced Sheet with the new design's Dropdown) */}
      {isOpen && (
        <div className="md:hidden absolute w-full bg-white/95 dark:bg-emerald-950/95 backdrop-blur-xl border-b border-emerald-100 dark:border-emerald-800 p-6 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-5 duration-200">
          <Link to="/" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Trang chủ
          </Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Giới thiệu
          </Link>
          <Link to="/search" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Tìm chuyến
          </Link>
          <Link to="/booking/lookup" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Tra cứu vé
          </Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Liên hệ
          </Link>

          <div className="h-px bg-emerald-100 dark:bg-emerald-800 my-2" />

          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10 border-2 border-emerald-200">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-950 dark:text-emerald-50">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                    {user.email}
                  </span>
                </div>
              </div>
              <Link
                to="/dashboard?tab=profile"
                onClick={() => setIsOpen(false)}
                className={mobileLinkClass}
              >
                Hồ sơ của tôi
              </Link>
              {user.role === 'PASSENGER' && (
                <Link
                  to="/dashboard?tab=tickets"
                  onClick={() => setIsOpen(false)}
                  className={mobileLinkClass}
                >
                  Vé của tôi
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-left font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                asChild
                className="w-full bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
              >
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  Đăng nhập
                </Link>
              </Button>
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
