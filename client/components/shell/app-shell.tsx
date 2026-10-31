import { Link } from 'react-router'

import { StarterMark } from '@/components/icons'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  email,
  isAdmin = false,
}: {
  children: React.ReactNode
  email: string
  isAdmin?: boolean
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="flex w-52 shrink-0 flex-col border-border border-r bg-sidebar">
        <div className="flex flex-1 flex-col p-4">
          <Link
            to="/dashboard"
            className="mb-6 flex items-center gap-2 text-foreground"
          >
            <StarterMark className="size-4" />
            <span className="text-sm tracking-tight">starter</span>
          </Link>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className={cn(
                'block h-7 rounded-md bg-accent px-2 text-xs leading-7 text-foreground',
              )}
            >
              Dashboard
            </Link>
            {isAdmin ? (
              <Link
                to="/admin/users"
                className="block h-7 rounded-md px-2 text-xs leading-7 text-muted-foreground transition-colors hover:text-foreground"
              >
                Admin
              </Link>
            ) : null}
          </nav>
          <div className="mt-auto space-y-3 pt-6">
            <p className="truncate px-2 text-muted-foreground text-xs" title={email}>
              {email}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = '/'
              }}
            >
              Sign out
            </Button>
            <ThemeSelector />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  )
}
