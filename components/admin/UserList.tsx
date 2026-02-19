'use client'

import { useState } from 'react'
import { UserRow } from './UserRow'

interface UserListProps {
    users: any[]
    departments: any[]
}

export function UserList({ users, departments }: UserListProps) {
    const [editingUserId, setEditingUserId] = useState<number | null>(null)

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600">User</th>
                        <th className="p-4 font-semibold text-slate-600">Username</th>
                        <th className="p-4 font-semibold text-slate-600">Role</th>
                        <th className="p-4 font-semibold text-slate-600">Status</th>
                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                        <UserRow
                            key={user.id}
                            user={user}
                            departments={departments}
                            isEditing={editingUserId === user.id}
                            onStartEdit={() => setEditingUserId(user.id)}
                            onStopEdit={() => setEditingUserId(null)}
                        />
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                No users yet. Add the first user above.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
