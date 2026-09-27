import { useForm, Link } from '@inertiajs/react'
import { useState } from 'react'

import { Container } from '@/components/layout'
import { Main } from '@/components/shell/main'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

import { authClient } from '../lib/auth-client'

type Props = { error: string | null }

export default function Login({ error: serverError }: Props) {
  const form = useForm({ email: '', password: '', name: '' })
  const magic = useForm({ email: '' })
  const [error, setError] = useState(serverError)

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
            const { error: err } = await authClient.signIn.email({
              email: form.data.email,
              password: form.data.password,
            })
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
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              value={form.data.password}
              onChange={(e) => form.setData('password', e.target.value)}
              required
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Log in</Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const { error: err } = await authClient.signUp.email({
                  email: form.data.email,
                  password: form.data.password,
                  name: form.data.name || form.data.email.split('@')[0],
                })
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
            const { error: err } = await authClient.signIn.magicLink({
              email: magic.data.email,
              callbackURL: '/dashboard',
            })
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
              value={magic.data.email}
              onChange={(e) => magic.setData('email', e.target.value)}
              required
            />
          </Field>
          <Button type="submit" variant="secondary">
            Email me a link
          </Button>
        </form>

        <Button variant="link" render={<Link href="/" />}>
          Home
        </Button>
      </Container>
    </Main>
  )
}
