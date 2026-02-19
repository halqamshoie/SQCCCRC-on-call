'use client'

import { updateUser, updateUserRole, updateUserDepartment, toggleUserActive, deleteUser, setUserLocalPassword } from "@/lib/user-actions"
import { Trash2, Shield, ShieldCheck, User, UserCog, Key, X, Check } from "lucide-react"
import { useTransition, useState } from "react"

interface UserData {
    id: number
    username: string
    displayName: string
    email: string | null
    role: string
    isActive: boolean
    localPassword?: string | null
    department?: { id: number; name: string } | null
}

const ROLE_BADGES: Record<string, { color: string; icon: typeof Shield }> = {
    ADMIN: { color: 'bg-red-100 text-red-800', icon: ShieldCheck },
    COORDINATOR: { color: 'bg-blue-100 text-blue-800', icon: UserCog },
    USER: { color: 'bg-slate-100 text-slate-600', icon: User },
}

export function UserRow({
    user,
    departments = [],
    isEditing,
    onStartEdit,
    onStopEdit
}: {
    user: UserData;
    departments?: any[];
    isEditing: boolean;
    onStartEdit: () => void;
    onStopEdit: () => void;
}) {
    const [isPending, startTransition] = useTransition()
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    // Local form state
    const [editForm, setEditForm] = useState({
        displayName: user.displayName,
        email: user.email || '',
        role: user.role,
        departmentId: user.department?.id || null
    })

    const badge = ROLE_BADGES[user.role] || ROLE_BADGES.USER
    const hasLocalPwd = !!user.localPassword

    const saveEdit = () => {
        startTransition(async () => {
            const result = await updateUser(user.id, {
                displayName: editForm.displayName,
                email: editForm.email || null,
                role: editForm.role as any,
                departmentId: editForm.role === 'COORDINATOR' ? Number(editForm.departmentId) : null
            })

            if (result.success) {
                onStopEdit()
            } else {
                alert(result.error)
            }
        })
    }

    const savePassword = () => {
        startTransition(async () => {
            const result = await setUserLocalPassword(user.id, newPassword)
            if (result.success) {
                setShowPasswordForm(false)
                setNewPassword('')
                alert(newPassword ? 'Local password set successfully!' : 'Local password removed.')
            } else {
                alert(result.error || 'Failed to set password')
            }
        })
    }

    // Password form modal
    if (showPasswordForm) {
        return (
            <tr className="bg-amber-50 border-l-4 border-l-amber-500">
                <td className="p-4" colSpan={5}>
                    <div className="flex items-center gap-4">
                        <Key size={20} className="text-amber-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 mb-2">
                                Set Local Password for <span className="font-bold">{user.displayName}</span>
                            </p>
                            <p className="text-xs text-slate-500 mb-3">
                                This allows login when LDAP is unreachable (e.g., outside network)
                            </p>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new local password..."
                                    className="flex-1 max-w-xs p-2 text-sm border rounded"
                                />
                                <button
                                    onClick={savePassword}
                                    disabled={isPending}
                                    className="px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    {isPending ? 'Saving...' : 'Set Password'}
                                </button>
                                {hasLocalPwd && (
                                    <button
                                        onClick={() => {
                                            setNewPassword('')
                                            savePassword()
                                        }}
                                        disabled={isPending}
                                        className="px-3 py-2 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 disabled:opacity-50"
                                    >
                                        Remove Password
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowPasswordForm(false)
                                        setNewPassword('')
                                    }}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        )
    }

    if (isEditing) {
        return (
            <tr className="bg-blue-50 border-l-4 border-l-blue-500">
                <td className="p-4 align-top" colSpan={2}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Display Name</label>
                            <input
                                value={editForm.displayName}
                                onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                                className="w-full text-sm p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                            <input
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full text-sm p-2 border rounded"
                            />
                        </div>
                    </div>
                </td>
                <td className="p-4 align-top" colSpan={2}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                            <select
                                value={editForm.role}
                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full text-sm p-2 border rounded bg-white"
                            >
                                <option value="USER">User</option>
                                <option value="COORDINATOR">Coordinator</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {editForm.role === 'COORDINATOR' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                                <select
                                    value={editForm.departmentId || ''}
                                    onChange={e => setEditForm({ ...editForm, departmentId: Number(e.target.value) })}
                                    className="w-full text-sm p-2 border rounded bg-white"
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </td>
                <td className="p-4 align-top text-right">
                    <div className="flex flex-col gap-2 items-end">
                        <button
                            onClick={saveEdit}
                            disabled={isPending}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onStopEdit}
                            disabled={isPending}
                            className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="p-4">
                <p className="text-slate-900 font-medium">{user.displayName}</p>
                {user.email && <p className="text-slate-400 text-xs">{user.email}</p>}
            </td>
            <td className="p-4 text-slate-500 font-mono text-sm">{user.username}</td>
            <td className="p-4">
                <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                        {user.role}
                    </span>

                    {user.role === 'COORDINATOR' && user.department && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {user.department.name}
                        </span>
                    )}

                    {user.role === 'COORDINATOR' && !user.department && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            No Dept
                        </span>
                    )}

                    {hasLocalPwd && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Key size={10} className="mr-1" /> Local Auth
                        </span>
                    )}
                </div>
            </td>
            <td className="p-4">
                <button
                    disabled={isPending}
                    onClick={() => startTransition(() => toggleUserActive(user.id, !user.isActive))}
                    className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} disabled:opacity-50`}
                >
                    {user.isActive ? 'Active' : 'Inactive'}
                </button>
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => {
                            setEditForm({
                                displayName: user.displayName,
                                email: user.email || '',
                                role: user.role,
                                departmentId: user.department?.id || null
                            })
                            onStartEdit()
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit User"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className={`transition-colors ${hasLocalPwd ? 'text-amber-500 hover:text-amber-700' : 'text-slate-400 hover:text-amber-600'}`}
                        title={hasLocalPwd ? 'Update Local Password' : 'Set Local Password'}
                    >
                        <Key size={18} />
                    </button>
                    <button
                        disabled={isPending}
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                                startTransition(() => deleteUser(user.id))
                            }
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete User"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    )
}

