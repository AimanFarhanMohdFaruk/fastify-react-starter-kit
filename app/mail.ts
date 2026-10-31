/**
 * Email transport adapter (infra — like app/object-store.ts).
 * Local: SMTP → Inbucket. Prod: Resend. Tests/CI: log.
 * Controllers do not send mail — auth callbacks / services call getMailer().
 */
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

export type Mailer = {
  send: (input: SendEmailInput) => Promise<void>
}

export type MailTransport = 'log' | 'smtp' | 'resend'

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for mail`)
  return value
}

function resolveTransport(): MailTransport {
  const raw = process.env.MAIL_TRANSPORT?.trim().toLowerCase()
  if (raw === 'smtp' || raw === 'resend' || raw === 'log') return raw
  return 'log'
}

function createLogMailer(): Mailer {
  return {
    async send(input) {
      console.log(`[mail] to=${input.to} subject=${input.subject}`)
      if (input.text) console.log(input.text)
    },
  }
}

function createSmtpMailer(): Mailer {
  const host = process.env.SMTP_HOST?.trim() || 'localhost'
  const port = Number(process.env.SMTP_PORT?.trim() || '2500')
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('SMTP_PORT must be a positive number')
  }
  const from = process.env.MAIL_FROM?.trim() || 'noreply@localhost'

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: false,
    tls: { rejectUnauthorized: false },
  })

  return {
    async send(input) {
      await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      })
    },
  }
}

function createResendMailer(): Mailer {
  const apiKey = requiredEnv('RESEND_API_KEY')
  const from = requiredEnv('MAIL_FROM')
  const resend = new Resend(apiKey)

  return {
    async send(input) {
      const { error } = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      })
      if (error) throw new Error(`Resend: ${error.message}`)
    },
  }
}

export function createMailerFromEnv(): Mailer {
  const transport = resolveTransport()
  if (transport === 'smtp') return createSmtpMailer()
  if (transport === 'resend') return createResendMailer()
  return createLogMailer()
}

let singleton: Mailer | null = null

export function getMailer(): Mailer {
  if (!singleton) singleton = createMailerFromEnv()
  return singleton
}

/** Tests only — swap or clear the process singleton. */
export function setMailerForTests(mailer: Mailer | null) {
  singleton = mailer
}
