import { Navigate } from 'react-router-dom';

import { Clock, CreditCard, Ticket } from 'lucide-react';

import { SearchForm } from '@/features/home/components/SearchForm';
import { getDashboardPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth-store';

export const HomePage = () => {
  // --- 1. Existing Logic ---
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'ADMIN') {
    return <Navigate to={getDashboardPath('ADMIN')} replace />;
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-emerald-950 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-700 transition-colors duration-500">
      {/* Hero Section */}
      <main className="relative pt-24 pb-24 px-6 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-0 md:right-20 w-64 h-64 bg-emerald-300 dark:bg-emerald-500 rounded-full blur-[100px] opacity-40 dark:opacity-20 animate-pulse"></div>
        <div className="absolute top-60 left-0 md:left-20 w-64 h-64 bg-orange-300 dark:bg-teal-700 rounded-full blur-[100px] opacity-30 dark:opacity-20"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-emerald-900/50 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white dark:border-emerald-800 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Thông báo: Đã mở bán vé xe tết nguyên đán 2026!
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-emerald-950 dark:text-emerald-50 leading-[1.1] tracking-tight mb-6">
            Hành trình mới bắt đầu <br />
            cùng{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-600 dark:from-emerald-300 dark:to-teal-400 inline-block hover:scale-105 transition-transform cursor-default">
              SwiftRide
            </span>
          </h1>

          <p className="text-xl text-emerald-800/80 dark:text-emerald-200/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bỏ qua việc xếp hàng chờ đợi. Đặt vé xe khách trực tuyến chỉ trong vài giây. Hiện đại,
            tiện lợi và êm ái hơn cả mong đợi.
          </p>
        </div>

        {/* --- Search Widget Section --- */}
        <div className="max-w-5xl mx-auto relative z-20">
          {/* Glossy Background Effect */}
          <div className="absolute -inset-4 bg-linear-to-r from-emerald-400 to-teal-400 rounded-[2.5rem] opacity-20 dark:opacity-10 blur-xl"></div>

          <div className="bg-white dark:bg-emerald-900/80 backdrop-blur-xl p-4 md:p-6 rounded-2xl relative shadow-2xl border border-white/20">
            <div className="w-full">
              <SearchForm />
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      {/* Features Grid */}
      <section className="bg-white dark:bg-emerald-900/20 py-24 px-6 border-t border-emerald-50 dark:border-emerald-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-emerald-950 dark:text-emerald-50">
            Tại sao chọn JoyRide?
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-orange-50 dark:hover:bg-emerald-900/40 transition-colors duration-300">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-3">
                Vé điện tử tức thì
              </h3>
              <p className="text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                Không cần in ấn. Chỉ cần hiển thị mã QR trên điện thoại và lên xe ngay.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-orange-50 dark:hover:bg-emerald-900/40 transition-colors duration-300">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-3">
                Lịch trình thời gian thực
              </h3>
              <p className="text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                Theo dõi vị trí xe trực tiếp để bạn luôn chủ động thời gian, không phải chờ đợi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-orange-50 dark:hover:bg-emerald-900/40 transition-colors duration-300">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-3">
                Thanh toán an toàn
              </h3>
              <p className="text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                Hỗ trợ hầu hết các ngân hàng tại Việt Nam, ví Momo và thẻ quốc tế.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
