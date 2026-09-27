import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import { Providers } from '@/components/shell/providers'
import '@/styles/globals.css'

createInertiaApp({
  id: 'root',
  resolve: (name) => {
    const pages = import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx', {
      eager: true,
    })
    const page = pages[`./pages/${name}.tsx`]
    if (!page) throw new Error(`Missing page: ${name}`)
    return page.default
  },
  setup({ el, App, props }) {
    const tree = (
      <Providers>
        <App {...props} />
      </Providers>
    )
    if (el.hasChildNodes()) hydrateRoot(el, tree)
    else createRoot(el).render(tree)
  },
})
