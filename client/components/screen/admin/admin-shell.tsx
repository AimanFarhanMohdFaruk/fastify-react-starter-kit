import { Link } from 'react-router'

import { Container } from '@/components/layout'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { cn } from '@/lib/utils'

export function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode
  active: 'users' | 'jobs'
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-border border-b">
        <Container className="flex h-14 items-center justify-between gap-4 sm:h-16">
          <nav className="flex items-center gap-6 text-sm">
            <span className="font-medium tracking-tight">admin</span>
            <Link
              to="/admin/users"
              className={cn(
                'text-muted-foreground hover:text-foreground',
                active === 'users' && 'text-foreground',
              )}
            >
              Users
            </Link>
            <Link
              to="/admin/jobs"
              className={cn(
                'text-muted-foreground hover:text-foreground',
                active === 'jobs' && 'text-foreground',
              )}
            >
              Jobs
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              App
            </Link>
          </nav>
          <ThemeSelector />
        </Container>
      </header>
      <main className="py-10">
        <Container>{children}</Container>
      </main>
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
