import { useRouteContext } from '@fastify/react/client'
import type { FastifyRequest } from 'fastify'

import { HomeScreen } from '@/components/screen/home/home'

type HomeData = {
	email: string | null
}

export async function getData(ctx: { req: FastifyRequest }) {
	const { getSessionUser } = await import('@app/controllers/auth')
	const user = await getSessionUser(ctx.req)
	return {
		email: user?.email ?? null,
	}
}

export function getMeta() {
	return { title: 'starter — Fastify React kit' }
}

export default function HomePage() {
	const { data } = useRouteContext() as { data: HomeData }
	return <HomeScreen email={data.email} />
}
