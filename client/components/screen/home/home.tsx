import { Link } from 'react-router'

import { StarterMark } from '@/components/icons'
import { Container, Section } from '@/components/layout'
import { Entrance } from '@/components/motion-primitives'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type HomeScreenProps = {
  email: string | null
  isAdmin: boolean
}

const features = [
  {
    title: 'Model / Domain driven',
    body: 'Schema, invariants, and queries live in one place, not scattered across route handlers.',
  },
  {
    title: 'Thin HTTP',
    body: 'Controllers gate auth, parse input, and call one model or service. Nothing more.',
  },
  {
    title: 'Real workers',
    body: 'pg-boss runs in its own process. Long work never blocks the web server.',
  },
  {
    title: 'Modern UI',
    body: 'React SSR is a plugin, not the product. You keep React and SSR, without adopting App Router.',
  },
] as const

function ProductPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-card shadow-xl',
        className,
      )}
    >
      <div className="flex border-b border-border">
        <div className="hidden w-44 shrink-0 border-r border-border bg-sidebar p-4 sm:block">
          <div className="mb-6 flex items-center gap-2">
            <StarterMark className="size-4 text-foreground" />
            <span className="text-sm tracking-tight">starter</span>
          </div>
          <div className="space-y-2">
            {['Overview', 'Jobs', 'Auth', 'Models'].map((item, i) => (
              <div
                key={item}
                className={cn(
                  'h-7 rounded-md px-2 text-xs leading-7 text-muted-foreground',
                  i === 1 && 'bg-accent text-foreground',
                )}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Background jobs</p>
              <p className="mt-1 font-heading text-2xl tracking-tight">
                demo-job
              </p>
            </div>
            <div className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs">
              Enqueue
            </div>
          </div>
          <div className="space-y-2">
            {[
              { id: 'job_8f2a', status: 'completed', tone: 'text-foreground' },
              {
                id: 'job_3c91',
                status: 'running',
                tone: 'text-muted-foreground',
              },
              {
                id: 'job_a01e',
                status: 'queued',
                tone: 'text-muted-foreground',
              },
              { id: 'job_77bd', status: 'completed', tone: 'text-foreground' },
            ].map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between border-border border-b py-2.5 last:border-0"
              >
                <span className="font-mono text-muted-foreground text-xs">
                  {row.id}
                </span>
                <span className={cn('text-xs capitalize', row.tone)}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
    </div>
  )
}

export function HomeScreen({ email, isAdmin }: HomeScreenProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.5_0_0/0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,oklch(1_0_0_/_0.08),transparent_55%)]"
      />

      <header className="relative z-10">
        <Container className="flex h-14 items-center justify-between sm:h-16">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <StarterMark className="size-5" />
            <span className="text-[15px] tracking-tight">starter</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector />
            {email ? (
              <>
                <Button size="sm" render={<Link to="/dashboard" />}>
                  Dashboard
                </Button>
                {isAdmin && (
                  <Button size="sm" render={<Link to="/admin/users" />}>
                    Admin
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" render={<Link to="/login" />}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        </Container>
      </header>

      <main className="relative z-10">
        <section className="flex flex-col items-center px-4 pt-16 pb-10 text-center sm:pt-24 sm:pb-14 md:pt-28">
          <Entrance effect="fade" className="mb-8">
            <p className="flex items-center justify-center gap-2 font-medium text-2xl tracking-tight sm:text-3xl">
              <StarterMark className="size-7 sm:size-8" />
              starter
            </p>
          </Entrance>

          <Entrance effect="blur" className="max-w-3xl">
            <h1 className="font-heading text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl md:text-6xl">
              The MVC stack for <em className="italic">modern</em> Fastify-React
              apps
            </h1>
          </Entrance>

          <Entrance
            effect="slide-up"
            className="mt-6 max-w-xl"
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              Fastify owns HTTP. React SSR is a plugin. Domain lives in fat
              models — not in the frontend.
            </p>
          </Entrance>

          <Entrance
            effect="slide-up"
            className="mt-8 flex flex-col items-center gap-3"
            transition={{ delay: 0.4, duration: 0.55 }}
          >
            {email ? (
              <>
                <Button size="lg" render={<Link to="/dashboard" />}>
                  Open dashboard
                </Button>
                <p className="text-muted-foreground text-sm">
                  Signed in as {email}
                </p>
              </>
            ) : (
              <>
                <Button size="lg" render={<Link to="/login" />}>
                  Start building
                </Button>
                <p className="text-muted-foreground text-sm">
                  Postgres · Better Auth · pg-boss · Vite SSR
                </p>
              </>
            )}
          </Entrance>
        </section>

        <section className="relative px-4 pb-20 sm:pb-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/3 h-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.5_0_0_/_0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.06),transparent_70%)]"
          />
          <Entrance
            effect="scale"
            className="relative mx-auto w-full max-w-5xl"
          >
            <ProductPreview />
          </Entrance>
        </section>

        <Section spacing="lg" className="border-border border-t">
          <Container>
            <Section.Header align="center" className="mx-auto max-w-2xl">
              <Section.Title>How it works</Section.Title>
              <Section.Description className="mx-auto">
                Stable seams with clear MVC boundaries
              </Section.Description>
            </Section.Header>
            <Section.Content className="mt-12">
              <Entrance.Stagger
                effect="slide-up"
                stagger={0.12}
                className="grid gap-10 sm:grid-cols-4 sm:gap-8"
              >
                {features.map((feature) => (
                  <Entrance.Stagger.Item key={feature.title}>
                    <h3 className="font-heading text-xl tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                      {feature.body}
                    </p>
                  </Entrance.Stagger.Item>
                ))}
              </Entrance.Stagger>
            </Section.Content>
          </Container>
        </Section>

        <footer className="border-border border-t py-10">
          <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <StarterMark className="size-3.5" />
              starter
            </p>
            <p className="text-muted-foreground text-sm">
              A real server you control, not another framework chase.
            </p>
          </Container>
        </footer>
      </main>
    </div>
  )
}
