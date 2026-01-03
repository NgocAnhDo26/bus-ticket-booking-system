import { Link } from 'react-router-dom';

import { Bus, Facebook, Mail, MapPin, Phone, Youtube } from 'lucide-react';

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'Giới thiệu', href: '/about' },
      { label: 'Tuyển dụng', href: '/careers' },
      { label: 'Tin tức', href: '/news' },
      { label: 'Liên hệ', href: '/contact' },
    ],
    support: [
      { label: 'Tra cứu vé', href: '/booking/lookup' },
      { label: 'Hướng dẫn đặt vé', href: '/guide' },
      { label: 'Chính sách hoàn vé', href: '/refund-policy' },
      { label: 'Câu hỏi thường gặp', href: '/faq' },
    ],
    legal: [
      { label: 'Điều khoản sử dụng', href: '/terms' },
      { label: 'Chính sách bảo mật', href: '/privacy' },
      { label: 'Quy chế hoạt động', href: '/regulations' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com', label: 'Youtube' },
  ];

  return (
    <footer className="bg-emerald-950 dark:bg-black/50 text-emerald-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-emerald-400 p-2 rounded-sm text-emerald-950 rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-400/20">
                <Bus size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                SwiftRide<span className="text-emerald-400">.</span>
              </span>
            </Link>
            <p className="text-sm opacity-70 leading-relaxed">
              Hệ thống đặt vé xe khách trực tuyến hàng đầu Việt Nam. Nhanh chóng, tiện lợi và an
              toàn.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 pt-2">
              <a
                href="tel:1900xxxx"
                className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 hover:text-emerald-300 transition-all"
              >
                <Phone size={16} />
                <span>1900 xxxx (24/7)</span>
              </a>
              <a
                href="mailto:support@swiftride.vn"
                className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 hover:text-emerald-300 transition-all"
              >
                <Mail size={16} />
                <span>support@swiftride.vn</span>
              </a>
              <div className="flex items-start gap-2 text-sm opacity-70">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Về chúng tôi
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-70 hover:opacity-100 hover:text-emerald-300 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-70 hover:opacity-100 hover:text-emerald-300 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links & Social */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Chính sách
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-70 hover:opacity-100 hover:text-emerald-300 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Kết nối với chúng tôi
              </h4>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-800 rounded-xl text-emerald-300 hover:bg-emerald-700 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
            <p>© {currentYear} SwiftRide Vietnam. Hành trình xanh & tiện lợi.</p>
            <p>
              Được phát triển bởi <span className="font-medium">AWAD Team</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
