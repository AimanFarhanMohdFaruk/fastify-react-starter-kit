import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { findExports } from 'mlly'
import type { Plugin } from 'vite'

export function appServerOnly(appRoot: string): Plugin {
  const root = resolve(appRoot)
  return {
    name: 'app-server-only',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0]
      if (!file.startsWith(root)) return
      if (this.environment?.name === 'ssr') return

      const source = readFileSync(file, 'utf8')
      let stubs = ''
      for (const exp of findExports(source)) {
        switch (exp.type) {
          case 'named':
            for (const name of exp.names) {
              stubs += `export const ${name} = {}\n`
            }
            break
          case 'default':
            stubs += 'export default {}\n'
            break
          case 'declaration':
            if (exp.name) stubs += `export const ${exp.name} = {}\n`
            break
        }
      }
      return stubs || 'export {}'
    },
  }
}
