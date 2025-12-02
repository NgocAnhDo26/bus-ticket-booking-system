import { SearchForm } from "../components/SearchForm";
import { useAuthStore } from "@/store/auth-store";
import { Navigate } from "react-router-dom";
import { getDashboardPath } from "@/lib/navigation";

export const HomePage = () => {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "ADMIN") {
    return <Navigate to={getDashboardPath("ADMIN")} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative h-[500px] w-full bg-primary/10 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            Vi vu khắp mọi nẻo đường
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Đặt vé xe khách trực tuyến dễ dàng, nhanh chóng và tin cậy.
            Hàng ngàn chuyến đi đang chờ đón bạn.
          </p>
        </div>
      </div>

      {/* Search Section - Overlapping Hero */}
      <div className="relative z-20 -mt-24 px-4">
        <SearchForm />
      </div>

      {/* Features Section */}
      <div className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3 className="text-xl font-semibold">An toàn & Tin cậy</h3>
                <p className="text-muted-foreground">Đối tác với các nhà xe uy tín hàng đầu, đảm bảo chuyến đi an toàn cho bạn.</p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                </div>
                <h3 className="text-xl font-semibold">Đặt vé nhanh chóng</h3>
                <p className="text-muted-foreground">Hệ thống đặt vé thông minh, thao tác đơn giản chỉ trong vài cú nhấp chuột.</p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
                </div>
                <h3 className="text-xl font-semibold">Giá cả cạnh tranh</h3>
                <p className="text-muted-foreground">Cam kết giá vé tốt nhất với nhiều ưu đãi hấp dẫn dành cho khách hàng.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
