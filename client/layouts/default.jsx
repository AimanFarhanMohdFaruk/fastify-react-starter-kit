import { Suspense } from 'react'

import { Providers } from '@/components/shell/providers'

export default function Layout({ children }) {
  return (
    <Providers>
      <Suspense>{children}</Suspense>
    </Providers>
  )
}
