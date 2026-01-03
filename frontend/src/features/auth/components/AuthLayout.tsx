import { type ReactNode } from 'react';

import { Bus } from 'lucide-react';

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
        <a href="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-400 p-2 rounded-sm text-emerald-950 rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-400/20">
            <Bus size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">
            SwiftRide<span className="text-emerald-400">.</span>
          </span>
        </a>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">{children}</div>
      </div>
    </div>
    <div className="bg-muted relative hidden lg:block">
      <img
        src="/login-page-illustration.png"
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6]"
      />
    </div>
  </div>
);
