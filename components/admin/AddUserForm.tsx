'use client'

import { createUser } from "@/lib/user-actions"
import { Shield, Loader2 } from "lucide-react"
import { useState, useCallback } from "react"
import { debounce } from "@/lib/utils"

export function AddUserForm({ departments }: { departments: any[] }) {
    const [isSearching, setIsSearching] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [role, setRole] = useState('USER') // USER, COORDINATOR, ADMIN
    const [selectedDepartment, setSelectedDepartment] = useState('')

    // Debounced LDAP search
    const searchLDAP = useCallback(
        debounce(async (usernameQuery: string) => {
            if (!usernameQuery || usernameQuery.length < 2) return

            setIsSearching(true)
            try {
                const res = await fetch(`/api/ad/search?q=${encodeURIComponent(usernameQuery)}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.users && data.users.length > 0) {
                        const user = data.users[0] // Take first match
                        setDisplayName(user.cn || '')
                        setEmail(user.mail || '')
                    }
                }
            } catch (error) {
                console.error('LDAP search failed:', error)
            } finally {
                setIsSearching(false)
            }
        }, 500),
        []
    )

    const handleUsernameChange = (value: string) => {
        setUsername(value)
        searchLDAP(value)
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                Add New User
            </h3>

            <form action={async (formData) => {
                await createUser(formData)
                // Reset form
                setUsername('')
                setDisplayName('')
                setEmail('')
                setRole('USER')
                setSelectedDepartment('')
            }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LDAP Username</label>
                    <div className="relative">
                        <input
                            name="username"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            required
                            className="w-full p-2 border border-slate-300 rounded-md text-slate-900 pr-8"
                            placeholder="e.g. j.smith"
                        />
                        {isSearching && (
                            <Loader2 size={16} className="absolute right-2 top-3 text-blue-500 animate-spin" />
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">The user's Active Directory login name</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                    <input
                        name="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="w-full p-2 border border-slate-300 rounded-md text-slate-900"
                        placeholder="Dr. John Smith"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                    <input
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className="w-full p-2 border border-slate-300 rounded-md text-slate-900"
                        placeholder="j.smith@sqccc.edu.local"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-slate-900"
                    >
                        <option value="USER">User (Read-only)</option>
                        <option value="COORDINATOR">Coordinator (Manage Schedules)</option>
                        <option value="ADMIN">Admin (Full Access)</option>
                    </select>
                </div>

                {role === 'COORDINATOR' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Department</label>
                        <select
                            name="departmentId"
                            required={role === 'COORDINATOR'}
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full p-2 border border-blue-200 ring-2 ring-blue-50 rounded-md text-slate-900 bg-blue-50"
                        >
                            <option value="">Select Department...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-500 mt-1">Coordinators can only manage staff in their assigned department</p>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors mt-4"
                >
                    Create User
                </button>
            </form>
        </div>
    )
}
