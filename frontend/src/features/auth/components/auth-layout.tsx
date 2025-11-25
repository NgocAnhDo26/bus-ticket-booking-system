import { type ReactNode } from 'react'
import { ThemeToggle } from '@/components/common/theme-toggle'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => (
  <div className="flex min-h-screen">
    <section className="hidden flex-1 flex-col justify-between bg-gradient-to-b from-primary to-secondary p-10 text-white lg:flex">
      <div>
        <p className="text-2xl font-semibold">SwiftRide</p>
        <p className="mt-4 max-w-sm text-lg opacity-90">
          Seamless bus ticketing with real-time seat selection and proactive notifications.
        </p>
      </div>
      <div className="space-y-4 text-sm opacity-80">
        <p>Trusted by commuters nationwide</p>
        <div className="rounded-card bg-white/10 p-4 backdrop-blur">
          <p className="text-lg font-semibold">“Booking trips feels effortless now.”</p>
          <p className="text-sm opacity-80">— Regular traveler</p>
        </div>
      </div>
    </section>
    <section className="flex min-h-screen flex-1 flex-col justify-center px-6 py-10 lg:px-16">
      <div className="ml-auto">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md space-y-6">
        <div>
          <h1 className="type-h1">{title}</h1>
          <p className="text-text-muted">{subtitle}</p>
        </div>
        <div className="rounded-card border border-border/60 bg-surface p-8 shadow-soft">{children}</div>
      </div>
    </section>
  </div>
)

