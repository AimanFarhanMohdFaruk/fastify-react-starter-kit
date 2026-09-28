import { Link } from 'react-router'

import { StarterMark } from '@/components/icons'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { cn } from '@/lib/utils'

const nav = [
  { id: 'users' as const, label: 'Users', to: '/admin/users' },
  { id: 'jobs' as const, label: 'Jobs', to: '/admin/jobs' },
]

export function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode
  active: 'users' | 'jobs'
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="flex w-44 shrink-0 flex-col border-border border-r bg-sidebar">
        <div className="flex flex-1 flex-col p-4">
          <Link to="/admin/users" className="mb-6 flex items-center gap-2 text-foreground">
            <StarterMark className="size-4" />
            <span className="text-sm tracking-tight">starter</span>
          </Link>
          <nav className="space-y-2">
            {nav.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  'block h-7 rounded-md px-2 text-xs leading-7 text-muted-foreground transition-colors hover:text-foreground',
                  active === item.id && 'bg-accent text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-6">
            <Link
              to="/dashboard"
              className="block h-7 rounded-md px-2 text-xs leading-7 text-muted-foreground hover:text-foreground"
            >
              App
            </Link>
            <ThemeSelector />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  )
}

export function AdminForbidden() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-heading text-2xl tracking-tight">403</p>
      <p className="text-muted-foreground text-sm">Admin access required.</p>
      <Link to="/dashboard" className="text-sm underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  )
}
