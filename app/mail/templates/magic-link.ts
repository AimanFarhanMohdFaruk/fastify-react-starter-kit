import type { SendEmailInput } from '../../mail'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Build the magic-link message — content only, no transport. */
export function magicLinkEmail(email: string, url: string): SendEmailInput {
  const safeUrl = escapeHtml(url)
  return {
    to: email,
    subject: 'Sign in',
    text: `Open this link to sign in:\n\n${url}\n`,
    html: `<p>Open this link to sign in:</p><p><a href="${safeUrl}">Sign in</a></p><p>${safeUrl}</p>`,
  }
}
