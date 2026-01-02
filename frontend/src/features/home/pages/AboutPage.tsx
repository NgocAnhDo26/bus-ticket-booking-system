import { Bus, Clock, MapPin, Shield, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative h-[300px] w-full bg-primary/10 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 dark:opacity-10" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            Về chúng tôi
          </h1>
          <p className="text-lg text-muted-foreground">
            SwiftRide - Đối tác tin cậy cho mọi chuyến đi của bạn
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Intro Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">SwiftRide là gì?</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            SwiftRide là nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam, kết nối hành khách
            với hàng trăm nhà xe uy tín trên toàn quốc. Chúng tôi cam kết mang đến trải nghiệm đặt
            vé nhanh chóng, tiện lợi và an toàn nhất.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <CardContent className="pt-0">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground mt-2">Nhà xe đối tác</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-0">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="text-muted-foreground mt-2">Tuyến đường</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-0">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="text-muted-foreground mt-2">Khách hàng</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-0">
              <div className="text-4xl font-bold text-primary">63</div>
              <div className="text-muted-foreground mt-2">Tỉnh thành</div>
            </CardContent>
          </Card>
        </section>

        {/* Values */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Giá trị cốt lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="pt-0 space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary w-fit">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">An toàn</h3>
                <p className="text-muted-foreground">
                  Chỉ hợp tác với các nhà xe được kiểm định, đảm bảo phương tiện đạt chuẩn an toàn.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="pt-0 space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary w-fit">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Tiện lợi</h3>
                <p className="text-muted-foreground">
                  Đặt vé mọi lúc mọi nơi, thanh toán đa dạng, nhận vé điện tử ngay tức thì.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="pt-0 space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary w-fit">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Tận tâm</h3>
                <p className="text-muted-foreground">
                  Đội ngũ hỗ trợ 24/7, sẵn sàng giải đáp mọi thắc mắc của khách hàng.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-muted/30 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Bus className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Sứ mệnh của chúng tôi</h2>
            <p className="text-lg text-muted-foreground">
              "Kết nối mọi hành trình - Mang đến trải nghiệm di chuyển tiện lợi, an toàn và đáng tin
              cậy cho hàng triệu người Việt. Chúng tôi tin rằng mỗi chuyến đi đều là một trải nghiệm
              đáng nhớ."
            </p>
          </div>
        </section>

        {/* Locations */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Phủ sóng toàn quốc</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Hà Nội',
              'TP. Hồ Chí Minh',
              'Đà Nẵng',
              'Cần Thơ',
              'Hải Phòng',
              'Nha Trang',
              'Đà Lạt',
              'Huế',
              'Quy Nhơn',
              'Vũng Tàu',
              'Phan Thiết',
              'Buôn Ma Thuột',
            ].map((city) => (
              <span
                key={city}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm"
              >
                <MapPin className="h-4 w-4 text-primary" />
                {city}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
