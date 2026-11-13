/**
 * HTTP shaping for posts — not domain types.
 * /api handlers and page getData both call postDto — one JSON shape.
 */
import { listPostsForUser } from '../../models/post'

type PostRow = Awaited<ReturnType<typeof listPostsForUser>>[number]

export type PostDto = {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

export function postDto(post: PostRow): PostDto {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

export function parsePostBody(body: unknown): { title: string; body: string } {
  const obj =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  return {
    title: obj.title != null ? String(obj.title) : '',
    body: obj.body != null ? String(obj.body) : '',
  }
}

export function parsePostPatch(body: unknown): {
  title?: string
  body?: string
} {
  const obj =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const out: { title?: string; body?: string } = {}
  if ('title' in obj) out.title = String(obj.title ?? '')
  if ('body' in obj) out.body = String(obj.body ?? '')
  return out
}
