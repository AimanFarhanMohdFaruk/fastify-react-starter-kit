/**
 * Soft-nav safe redirects from page loader data (`{ redirectTo }`).
 * Never use reply.redirect in getData / gatePage — breaks /-/data/*.
 */
import type { ReactElement } from 'react'
import { Navigate } from 'react-router'

export function hasRedirectTo(
  data: unknown,
): data is { redirectTo: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'redirectTo' in data &&
    typeof (data as { redirectTo: unknown }).redirectTo === 'string' &&
    (data as { redirectTo: string }).redirectTo.length > 0
  )
}

/** `<Navigate>` when loader returned `{ redirectTo }`; otherwise null (falsy). */
export function pageRedirect(data: unknown): ReactElement | null {
  if (!hasRedirectTo(data)) return null
  return <Navigate to={data.redirectTo} replace />
}
