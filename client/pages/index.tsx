import { Link } from 'react-router'
import { useRouteContext } from '@fastify/react/client'
import type { FastifyRequest } from 'fastify'

import { Container, Section } from '@/components/layout'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Main } from '@/components/shell/main'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type HomeData = {
  title: string
  email: string | null
}

export async function getData(ctx: { req: FastifyRequest }) {
  const { getSessionUser } = await import('@app/controllers/auth')
  const user = await getSessionUser(ctx.req)
  return {
    title: 'Fastify React starter',
    email: user?.email ?? null,
  }
}

export function getMeta() {
  return { title: 'Fastify React starter' }
}

export default function Home() {
  const { data } = useRouteContext() as { data: HomeData }
  const { title, email } = data

  return (
    <Main className="my-0 py-12">
      <Container className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="secondary">fastify-react-starter</Badge>
          <ThemeSelector />
        </div>

        <Section spacing="none">
          <Section.Header>
            <Section.Eyebrow>Fastify · @fastify/react · Drizzle</Section.Eyebrow>
            <Section.Title>{title}</Section.Title>
            <Section.Description>
              Rails-shaped monolith: models own domain, UI stays
              presentation-only.
            </Section.Description>
          </Section.Header>
          <Section.Content className="mt-8 flex flex-wrap gap-3">
            {email ? (
              <>
                <p className="w-full text-muted-foreground text-sm">
                  Signed in as{' '}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button render={<Link to="/dashboard" />}>Dashboard</Button>
              </>
            ) : (
              <Button render={<Link to="/login" />}>Sign in</Button>
            )}
          </Section.Content>
        </Section>
      </Container>
    </Main>
  )
}
