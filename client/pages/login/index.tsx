import { Link } from 'react-router'
import { useState } from 'react'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Container } from '@/components/layout'
import { Main } from '@/components/shell/main'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

import { authClient } from '../../lib/auth-client'

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('../../../app/controllers/auth')
  const user = await getSessionUser(ctx.req)
  if (user) {
    ctx.reply.redirect('/dashboard')
    return {}
  }
  return { error: null as string | null }
}

export function getMeta() {
  return { title: 'Sign in' }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [magicEmail, setMagicEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <Main className="my-0 py-12">
      <Container size="narrow" className="space-y-8">
        <div className="space-y-2">
          <p className="font-medium text-muted-foreground text-sm">
            Better Auth · email/password + magic link
          </p>
          <h1 className="font-bold text-3xl tracking-tight">Sign in</h1>
        </div>

        {error ? (
          <Alert variant="error">
            <AlertTitle>Could not continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            const { error: err } = await authClient.signIn.email({
              email,
              password,
            })
            setBusy(false)
            if (err) {
              setError(err.message ?? 'Login failed')
              return
            }
            window.location.href = '/dashboard'
          }}
        >
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} loading={busy}>
              Log in
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                const { error: err } = await authClient.signUp.email({
                  email,
                  password,
                  name: name || email.split('@')[0],
                })
                setBusy(false)
                if (err) {
                  setError(err.message ?? 'Register failed')
                  return
                }
                window.location.href = '/dashboard'
              }}
            >
              Register
            </Button>
          </div>
        </form>

        <Separator />

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            const { error: err } = await authClient.signIn.magicLink({
              email: magicEmail,
              callbackURL: '/dashboard',
            })
            setBusy(false)
            if (err) {
              setError(err.message ?? 'Magic link failed')
              return
            }
            setError(null)
            alert('Check the web server console for the magic link URL')
          }}
        >
          <h2 className="font-semibold text-lg">Magic link</h2>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={busy}>
            Email me a link
          </Button>
        </form>

        <Button variant="link" render={<Link to="/" />}>
          Home
        </Button>
      </Container>
    </Main>
  )
}
