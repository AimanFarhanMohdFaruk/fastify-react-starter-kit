import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import {
  createMailerFromEnv,
  getMailer,
  setMailerForTests,
  type SendEmailInput,
} from '../app/mail'
import { magicLinkEmail } from '../app/mail/templates/magic-link'

describe('mail', () => {
  afterEach(() => {
    setMailerForTests(null)
    delete process.env.MAIL_TRANSPORT
    delete process.env.RESEND_API_KEY
    delete process.env.MAIL_FROM
  })

  test('magicLinkEmail includes recipient, subject, and url', () => {
    const msg = magicLinkEmail('user@example.com', 'http://localhost:3000/magic?t=abc')
    assert.equal(msg.to, 'user@example.com')
    assert.equal(msg.subject, 'Sign in')
    assert.match(msg.text, /http:\/\/localhost:3000\/magic\?t=abc/)
    assert.ok(msg.html)
    assert.match(msg.html!, /href="http:\/\/localhost:3000\/magic\?t=abc"/)
  })

  test('magicLinkEmail escapes html in url', () => {
    const msg = magicLinkEmail('a@b.c', 'http://x.test/"onclick=evil')
    assert.ok(msg.html)
    // Quote is escaped so a forged attribute cannot break out of href.
    assert.match(msg.html!, /href="http:\/\/x\.test\/&quot;onclick=evil"/)
  })

  test('createMailerFromEnv defaults to log transport', async () => {
    delete process.env.MAIL_TRANSPORT
    const mailer = createMailerFromEnv()
    await mailer.send({
      to: 'a@b.c',
      subject: 't',
      text: 'hello',
    })
  })

  test('createMailerFromEnv resend requires API key and from', () => {
    process.env.MAIL_TRANSPORT = 'resend'
    delete process.env.RESEND_API_KEY
    delete process.env.MAIL_FROM
    assert.throws(() => createMailerFromEnv(), /RESEND_API_KEY/)
  })

  test('recording mailer via setMailerForTests', async () => {
    const sent: SendEmailInput[] = []
    setMailerForTests({
      async send(input) {
        sent.push(input)
      },
    })

    await getMailer().send(magicLinkEmail('rec@example.com', 'http://example.com/l'))
    assert.equal(sent.length, 1)
    assert.equal(sent[0]?.to, 'rec@example.com')
  })
})

