/**
 * Copy this starter into a new app directory and rename project identifiers.
 *
 *   npm run create-app -- <app-name> [destination]
 *
 * Examples:
 *   npm run create-app -- acme
 *   npm run create-app -- my-app ../apps/my-app
 *
 * Replaces starter kit identifiers (compose user/db/volume/network, env URLs,
 * package name, testcontainer credentials) with the app slug — not English
 * prose, and not packages like drizzle-kit.
 */
import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const SKIP_DIRS = new Set([
  '.git',
  '.data',
  '.scratch',
  'node_modules',
  'dist',
  'build',
  'client/dist',
  'test-results',
  'playwright-report',
  'playwright/.auth',
])

const SKIP_FILES = new Set(['.database-url', '.env', '.env.production'])

/** Text files where bare `kit` (user/password/network) is rewritten. */
const BARE_KIT_FILES = new Set([
  'docker-compose.yml',
  'docker-compose.prod.yml',
  '.env.example',
  '.env.production.example',
  'drizzle.config.ts',
  'test/harness/db.ts',
  'README.md',
])

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.sql',
  '.css',
  '.html',
  '.txt',
  '.example',
  '.gitignore',
  '.env',
])

function usage(): never {
  console.error('Usage: npm run create-app -- <app-name> [destination]')
  process.exit(1)
}

function slugs(raw: string) {
  const kebab = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!kebab || !/^[a-z]/.test(kebab)) {
    throw new Error('App name must start with a letter (e.g. acme, my-app)')
  }
  const snake = kebab.replace(/-/g, '_')
  return { kebab, snake }
}

function shouldSkip(rel: string) {
  const parts = rel.split(path.sep)
  if (parts.some((p) => SKIP_DIRS.has(p))) return true
  if (SKIP_FILES.has(path.basename(rel))) return true
  return false
}

function isTextFile(filePath: string) {
  const base = path.basename(filePath)
  if (base === 'Dockerfile' || base === '.gitignore' || base.startsWith('.env'))
    return true
  return TEXT_EXT.has(path.extname(filePath))
}

function rewriteContent(
  content: string,
  rel: string,
  snake: string,
  kebab: string,
) {
  let out = content
    .replaceAll('starter_kit', snake)
    .replaceAll('kit_pg_data', `${snake}_pg_data`)
    .replaceAll('kit_test', `${snake}_test`)
    .replaceAll('postgres://kit:kit@', `postgres://${snake}:${snake}@`)
    .replaceAll('fastify-react-starter', kebab)

  if (BARE_KIT_FILES.has(rel.replaceAll('\\', '/'))) {
    out = out
      .replaceAll(`'kit'`, `'${snake}'`)
      .replaceAll(`"kit"`, `"${snake}"`)
      .replace(/(POSTGRES_USER:\s*)kit\b/g, `$1${snake}`)
      .replace(/(POSTGRES_PASSWORD:\s*)kit\b/g, `$1${snake}`)
      .replace(/(-U\s+)kit\b/g, `$1${snake}`)
      .replace(/^(\s+-\s+)kit\s*$/gm, `$1${snake}`)
      .replace(/^(\s{2})kit:\s*$/gm, `$1${snake}:`)
  }

  return out
}

async function walkDest(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(base, full)
    if (shouldSkip(rel)) continue
    if (entry.isDirectory()) files.push(...(await walkDest(full, base)))
    else files.push(full)
  }
  return files
}

async function main() {
  const nameArg = process.argv[2]
  if (!nameArg) usage()

  const { kebab, snake } = slugs(nameArg)
  // Default: sibling of this starter (avoids nesting under the kit itself).
  const destArg = process.argv[3] ?? path.join(path.dirname(root), kebab)
  const dest = path.resolve(destArg)

  if (dest === root || dest.startsWith(root + path.sep)) {
    throw new Error('Destination must be outside the starter root')
  }

  try {
    await access(dest)
    throw new Error(`Destination already exists: ${dest}`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }

  console.log(`Copying starter → ${dest}`)
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(root, dest, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(root, src)
      if (!rel) return true
      return !shouldSkip(rel)
    },
  })

  const destFiles = await walkDest(dest)
  let rewritten = 0
  for (const file of destFiles) {
    if (!isTextFile(file)) continue
    const rel = path.relative(dest, file).replaceAll('\\', '/')
    const before = await readFile(file, 'utf8')
    const after = rewriteContent(before, rel, snake, kebab)
    if (after !== before) {
      await writeFile(file, after, 'utf8')
      rewritten += 1
    }
  }

  console.log(`Done. Rewrote ${rewritten} files (slug: ${kebab} / ${snake}).`)
  console.log(`Next:
  cd ${dest}
  cp .env.example .env
  npm install
  npm run db:up && npm run db:migrate
  npm run dev`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
