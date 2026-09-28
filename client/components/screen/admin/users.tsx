import { Link } from 'react-router'

import { AdminShell } from '@/components/screen/admin/admin-shell'

export type AdminUserRow = {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  return (
    <AdminShell active="users">
      <h1 className="font-heading text-3xl tracking-tight">Users</h1>
      <p className="mt-2 text-muted-foreground text-sm">All accounts in this kit.</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-border border-b text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-border border-b">
                <td className="py-3 pr-4">
                  <Link to={`/admin/users/${u.id}`} className="underline-offset-4 hover:underline">
                    {u.email}
                  </Link>
                </td>
                <td className="py-3 pr-4">{u.name}</td>
                <td className="py-3 pr-4">{u.role}</td>
                <td className="py-3 text-muted-foreground">{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export function AdminUserDetail({ user }: { user: AdminUserRow }) {
  return (
    <AdminShell active="users">
      <p className="text-muted-foreground text-sm">
        <Link to="/admin/users" className="underline-offset-4 hover:underline">
          Users
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight">{user.email}</h1>
      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Id</dt>
          <dd className="mt-1 font-mono text-xs">{user.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd className="mt-1">{user.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="mt-1">{user.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="mt-1">{user.createdAt}</dd>
        </div>
      </dl>
    </AdminShell>
  )
}
