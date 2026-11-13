import { Link } from 'react-router'

import { AdminShell } from '@/components/screen/admin/admin-shell'

export type AdminPostRow = {
  id: string
  title: string
  body?: string
  createdAt: string
  updatedAt?: string
  userId: string
  userEmail: string
}

export function AdminPostsList({ posts }: { posts: AdminPostRow[] }) {
  return (
    <AdminShell active="posts">
      <h1 className="font-heading text-3xl tracking-tight">Posts</h1>
      <p className="mt-2 text-muted-foreground text-sm">Posts across all users.</p>
      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground text-sm">No posts yet.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="border-border border-b pb-3">
              <Link
                to={`/admin/posts/${p.id}`}
                className="font-medium text-sm underline-offset-4 hover:underline"
              >
                {p.title}
              </Link>
              <p className="mt-1 text-muted-foreground text-xs">
                {p.userEmail} · {p.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}

export function AdminPostDetail({ post }: { post: AdminPostRow }) {
  return (
    <AdminShell active="posts">
      <p className="text-muted-foreground text-sm">
        <Link to="/admin/posts" className="underline-offset-4 hover:underline">
          Posts
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
        {post.title}
      </h1>
      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Author</dt>
          <dd className="mt-1">
            <Link
              to={`/admin/users/${post.userId}`}
              className="underline-offset-4 hover:underline"
            >
              {post.userEmail}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Created</dt>
          <dd className="mt-1">{post.createdAt}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Body</dt>
          <dd className="mt-1 whitespace-pre-wrap">{post.body || '—'}</dd>
        </div>
      </dl>
    </AdminShell>
  )
}
