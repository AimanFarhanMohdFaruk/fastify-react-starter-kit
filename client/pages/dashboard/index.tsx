import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import type { DocumentDto, PostDto } from '@/lib/api'

type DashboardData = {
  email: string
  isAdmin: boolean
  posts: PostDto[]
  documents: DocumentDto[]
  documentAccept: string
  documentMaxBytes: number
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('@app/controllers/auth')
  const { isAdmin } = await import('@app/models/admin')
  const { listPostsForUser } = await import('@app/models/post')
  const { listDocumentsForUser } = await import('@app/models/document')
  const { postDto } = await import('@app/controllers/posts/dto')
  const { documentDto } = await import('@app/controllers/documents/dto')
  const { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES } = await import(
    '@app/services/upload-document'
  )
  const user = await getSessionUser(ctx.req)
  if (!user) {
    ctx.reply.redirect('/login')
    return {}
  }
  const [postRows, docs] = await Promise.all([
    listPostsForUser(user.id),
    listDocumentsForUser(user.id),
  ])
  return {
    email: user.email,
    isAdmin: isAdmin(user),
    documentAccept: DOCUMENT_ACCEPT,
    documentMaxBytes: DOCUMENT_MAX_BYTES,
    posts: postRows.map(postDto),
    documents: docs.map(documentDto),
  }
}

export function getMeta() {
  return { title: 'Dashboard' }
}

export default function DashboardPage() {
  const { data } = useRouteContext() as { data: DashboardData }
  return (
    <Dashboard
      email={data.email}
      isAdmin={data.isAdmin}
      posts={data.posts}
      documents={data.documents ?? []}
      documentAccept={data.documentAccept}
      documentMaxBytes={data.documentMaxBytes}
    />
  )
}
