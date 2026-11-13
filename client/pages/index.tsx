import { useRouteContext } from '@fastify/react/client'
import type { FastifyRequest } from 'fastify'

import { HomeScreen } from '@/components/screen/home/home'

type HomeData = {
  email: string | null
  isAdmin: boolean
}

export async function getData(ctx: { req: FastifyRequest }) {
  const { loadHomePage } = await import('@app/controllers/home/loaders')
  return loadHomePage(ctx.req)
}

export function getMeta() {
  return { title: 'starter — Fastify React kit' }
}

export default function HomePage() {
  const { data } = useRouteContext() as { data: HomeData }
  return <HomeScreen email={data.email} isAdmin={data.isAdmin} />
}
