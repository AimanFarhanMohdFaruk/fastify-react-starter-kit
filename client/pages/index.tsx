import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { HomePageData } from '@app/controllers/home/loaders'

import { HomeScreen } from '@/components/screen/home/home'

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { loadHomePage } = await import('@app/controllers/home/loaders')
  return loadHomePage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'starter — Fastify React kit' }
}

export default function HomePage() {
  const { data } = useRouteContext() as { data: HomePageData }
  return <HomeScreen email={data.email} isAdmin={data.isAdmin} />
}
