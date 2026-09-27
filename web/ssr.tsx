import ReactDOMServer from 'react-dom/server'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import type { ReactNode } from 'react'

import { Providers } from '@/components/shell/providers'

/** SSR entry for alex-fastify-inertiajs (`ssrEntrypoint`). */
export default function render(page: Record<string, unknown>) {
  return createInertiaApp({
    id: 'root',
    page: page as never,
    render: ReactDOMServer.renderToString as never,
    resolve: (name: string) => {
      const pages = import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx', {
        eager: true,
      })
      const mod = pages[`./pages/${name}.tsx`]
      if (!mod) throw new Error(`Missing page: ${name}`)
      return mod.default
    },
    setup: ({ App, props }: { App: (p: { children?: ReactNode }) => ReactNode; props: object }) => (
      <Providers>
        <App {...props} />
      </Providers>
    ),
  } as never)
}
