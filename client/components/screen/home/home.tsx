import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { StarterMark } from '@/components/icons'
import { Container } from '@/components/layout'
import { Entrance } from '@/components/motion-primitives'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type HomeScreenProps = {
  email: string | null
  isAdmin: boolean
}

type WalkStep = {
  id: string
  label: string
  file: string
  title: string
  body: string
  requirements: string[]
  code: { line: string; tone?: 'muted' | 'kw' | 'str' | 'fn' | 'plain' }[]
  result: {
    eyebrow: string
    lines: string[]
  }
}

const steps: WalkStep[] = [
  {
    id: 'model',
    label: 'Model',
    file: 'app/models/post.ts',
    title: 'Domain stays fat',
    body: 'Schema, invariants, and queries live in one module. Handlers and pages never re-invent the rules.',
    requirements: [
      'Throw ValidationError for bad input',
      'Scope reads/writes to the owning User',
      'Never import controllers, queue, or client',
    ],
    code: [
      { line: 'export async function createPost(', tone: 'fn' },
      { line: '  userId: string,', tone: 'muted' },
      { line: '  input: { title: string; body?: string },', tone: 'muted' },
      { line: ') {', tone: 'fn' },
      { line: "  const title = input.title.trim()", tone: 'plain' },
      { line: "  if (!title) throw new ValidationError('Title required')", tone: 'kw' },
      { line: '  // …persist via Drizzle', tone: 'muted' },
      { line: '}', tone: 'fn' },
    ],
    result: {
      eyebrow: 'Invariant',
      lines: [
        'empty title → ValidationError',
        'composeWebApp → 400 JSON',
        'one place to fix forever',
      ],
    },
  },
  {
    id: 'queue',
    label: 'Queue',
    file: 'app/queue/handlers.ts',
    title: 'Jobs are just services',
    body: 'Add a service, register it on the handlers map, enqueue by name. Delivery is an adapter — pg-boss in prod, inline in tests.',
    requirements: [
      'Job body lives in app/services/',
      'One handlers map entry',
      'Callers only learn enqueue(name, args)',
    ],
    code: [
      { line: 'export const handlers = {', tone: 'fn' },
      { line: '  shout,', tone: 'plain' },
      { line: '  parse_document: parseDocument,', tone: 'plain' },
      { line: '} as const', tone: 'fn' },
      { line: '', tone: 'muted' },
      { line: "await enqueue('parse_document', {", tone: 'kw' },
      { line: '  documentId: doc.id,', tone: 'str' },
      { line: '})', tone: 'kw' },
    ],
    result: {
      eyebrow: 'Stupid bus',
      lines: [
        'web → enqueue',
        'adapter.send → worker',
        'no domain row required',
      ],
    },
  },
  {
    id: 'gate',
    label: 'Page gate',
    file: 'app/controllers/page-gate.ts',
    title: 'SSR policy in one seam',
    body: 'Loaders pick a policy. Redirect and 403 live here — not copied into every page.',
    requirements: [
      'Policies: public · signedIn · guestOnly · admin',
      'if (!gate.ok) return gate.data',
      '/api still uses requireSession',
    ],
    code: [
      { line: "const gate = await gatePage(req, reply, 'signedIn')", tone: 'kw' },
      { line: 'if (!gate.ok) return gate.data', tone: 'plain' },
      { line: '', tone: 'muted' },
      { line: 'return {', tone: 'fn' },
      { line: '  email: gate.user.email,', tone: 'str' },
      { line: '  posts: rows.map(postDto),', tone: 'plain' },
      { line: '}', tone: 'fn' },
    ],
    result: {
      eyebrow: 'Loader path',
      lines: [
        'getData → one load*Page',
        'gate → query → *Dto',
        'pages import type only',
      ],
    },
  },
  {
    id: 'agents',
    label: 'Agents',
    file: 'AGENTS.md',
    title: 'Grow with agents, on purpose',
    body: 'Stable seams and a short agent guide mean new features land in the right folders — without rewriting the stack.',
    requirements: [
      'Fat models, thin controllers',
      'One JSON seam (*Dto)',
      'Typed AppError → setErrorHandler',
    ],
    code: [
      { line: '# Agent guide', tone: 'muted' },
      { line: '', tone: 'muted' },
      { line: '- Fat models, thin controllers', tone: 'plain' },
      { line: '- gatePage for SSR policies', tone: 'plain' },
      { line: '- enqueue(name, args) — stupid bus', tone: 'plain' },
      { line: '- Throw AppError; mapper owns status', tone: 'kw' },
    ],
    result: {
      eyebrow: 'Comprehension',
      lines: [
        'same map every feature',
        'less framework chase',
        'agents stay inside the rails',
      ],
    },
  },
] as const

function CodeLine({
  line,
  tone = 'plain',
  n,
}: {
  line: string
  tone?: WalkStep['code'][number]['tone']
  n: number
}) {
  return (
    <div className="flex gap-3 font-mono text-[11px] leading-5 sm:text-xs sm:leading-6">
      <span className="w-5 shrink-0 select-none text-right text-muted-foreground/50">
        {n}
      </span>
      <span
        className={cn(
          'min-w-0 whitespace-pre-wrap break-all',
          tone === 'muted' && 'text-muted-foreground',
          tone === 'kw' && 'text-foreground',
          tone === 'str' && 'text-foreground/80',
          tone === 'fn' && 'text-foreground',
          tone === 'plain' && 'text-foreground/90',
        )}
      >
        {line || ' '}
      </span>
    </div>
  )
}

function CodeExplorer() {
  const [activeId, setActiveId] = useState<string>(steps[0].id)
  const reduceMotion = useReducedMotion()
  const step = steps.find((s) => s.id === activeId) ?? steps[0]

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xl">
      <div className="flex items-center gap-2 border-border border-b bg-muted/40 px-3 py-2">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
          walkthrough · starter
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Walkthrough steps"
        className="flex gap-1 overflow-x-auto border-border border-b px-2 py-2"
      >
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === activeId}
            onClick={() => setActiveId(s.id)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors',
              s.id === activeId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,0.9fr)]"
        >
          {/* Spec */}
          <div className="border-border border-b p-4 sm:p-5 lg:border-r lg:border-b-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Description
            </p>
            <h3 className="mt-2 font-heading text-xl tracking-tight">{step.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              {step.body}
            </p>
            <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Requirements
            </p>
            <ul className="mt-2 space-y-1.5">
              {step.requirements.map((r) => (
                <li
                  key={r}
                  className="flex gap-2 text-sm leading-snug text-foreground/90"
                >
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code */}
          <div className="border-border border-b bg-muted/20 lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between border-border border-b px-4 py-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {step.file}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Solution
              </span>
            </div>
            <div className="space-y-0.5 p-4">
              {step.code.map((row, i) => (
                <CodeLine key={`${step.id}-${i}`} n={i + 1} {...row} />
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="bg-foreground text-background dark:bg-card dark:text-card-foreground">
            <div className="flex items-center justify-between border-white/10 border-b px-4 py-2 dark:border-border">
              <span className="font-mono text-[11px] text-background/60 dark:text-muted-foreground">
                /
              </span>
              <span className="text-[10px] uppercase tracking-wider text-background/60 dark:text-muted-foreground">
                Result
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-background/50 dark:text-muted-foreground">
                {step.result.eyebrow}
              </p>
              <ul className="mt-4 space-y-3">
                {step.result.lines.map((line) => (
                  <li
                    key={line}
                    className="border-white/10 border-b pb-3 font-mono text-sm last:border-0 last:pb-0 dark:border-border"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function HomeScreen({ email, isAdmin }: HomeScreenProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.55_0_0/0.1),transparent_50%),radial-gradient(ellipse_at_80%_20%,oklch(0.45_0_0/0.08),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_20%_0%,oklch(1_0_0/0.07),transparent_50%),radial-gradient(ellipse_at_85%_10%,oklch(1_0_0/0.05),transparent_40%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2] [background-image:linear-gradient(to_right,oklch(0.5_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
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
              <Button size="sm" variant="ghost" render={<Link to="/login" />}>
                Sign in
              </Button>
            )}
          </div>
        </Container>
      </header>

      <main className="relative z-10">
        <section className="px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Entrance effect="fade" className="mb-6">
              <p className="flex items-center justify-center gap-2 font-medium text-xl tracking-tight sm:text-2xl">
                <StarterMark className="size-6 sm:size-7" />
                starter
              </p>
            </Entrance>

            <Entrance effect="blur" className="max-w-3xl">
              <h1 className="font-heading text-[2.15rem] leading-[1.08] tracking-[-0.03em] sm:text-5xl md:text-[3.25rem]">
                A lightweight full-stack Fastify kit that grows without
                sacrificing comprehension.
              </h1>
            </Entrance>

            <Entrance
              effect="slide-up"
              className="mt-5 max-w-xl"
              transition={{ delay: 0.2, duration: 0.55 }}
            >
              <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
                Grow your repo using agents with confidence.
              </p>
            </Entrance>

            <Entrance
              effect="slide-up"
              className="mt-7 flex flex-col items-center gap-3"
              transition={{ delay: 0.35, duration: 0.5 }}
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
                    Fastify · Vite SSR · Postgres · Better Auth · pg-boss
                  </p>
                </>
              )}
            </Entrance>
          </div>
        </section>

        <section className="relative px-4 pb-16 sm:pb-24">
          <Entrance
            effect="scale"
            className="relative mx-auto w-full max-w-6xl"
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <CodeExplorer />
          </Entrance>
          <p className="mx-auto mt-4 max-w-6xl text-center text-muted-foreground text-xs sm:text-left">
            Spec · code · result — the same seams agents follow in{' '}
            <span className="font-mono text-foreground/80">AGENTS.md</span>.
          </p>
        </section>

        <footer className="border-border border-t py-10">
          <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <StarterMark className="size-3.5" />
              starter
            </p>
            <p className="text-muted-foreground text-sm">
              A real server you control — MVC seams agents can grow.
            </p>
          </Container>
        </footer>
      </main>
    </div>
  )
}
