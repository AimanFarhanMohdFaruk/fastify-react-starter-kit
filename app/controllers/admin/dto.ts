/**
 * Admin page JSON shapes — getData (and future /api/admin) call these.
 */
import {
  getPostForAdmin,
  getUserForAdmin,
  listPostsForAdmin,
  listUsersForAdmin,
} from '../../models/admin'

type AdminUserRow = Awaited<ReturnType<typeof listUsersForAdmin>>[number]
type AdminUserDetailRow = NonNullable<Awaited<ReturnType<typeof getUserForAdmin>>>
type AdminPostListRow = Awaited<ReturnType<typeof listPostsForAdmin>>[number]
type AdminPostDetailRow = NonNullable<Awaited<ReturnType<typeof getPostForAdmin>>>

export type AdminUserDto = {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export type AdminPostDto = {
  id: string
  title: string
  body?: string
  createdAt: string
  updatedAt?: string
  userId: string
  userEmail: string
}

export function adminUserDto(user: AdminUserRow | AdminUserDetailRow): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}

export function adminPostListDto(post: AdminPostListRow): AdminPostDto {
  return {
    id: post.id,
    title: post.title,
    createdAt: post.createdAt.toISOString(),
    userId: post.userId,
    userEmail: post.userEmail,
  }
}

export function adminPostDetailDto(post: AdminPostDetailRow): AdminPostDto {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    userId: post.userId,
    userEmail: post.userEmail,
  }
}
