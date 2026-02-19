'use client'

import { useState, useTransition, useEffect } from 'react'
import { Search, UserPlus, Loader2 } from 'lucide-react'

interface ADUser {
    dn: string
    cn: string
    sAMAccountName: string
    mail?: string
    department?: string
    telephoneNumber?: string
}

interface ADUserSearchProps {
    onSelectUser: (user: ADUser) => void
}

export function ADUserSearch({ onSelectUser }: ADUserSearchProps) {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState<ADUser[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async () => {
        if (!query.trim()) return

        setIsSearching(true)
        setError(null)

        try {
            const res = await fetch(`/api/ad/search?q=${encodeURIComponent(query)}`)
            if (!res.ok) throw new Error('Search failed')
            const data = await res.json()
            setUsers(data.users || [])
        } catch (err) {
            setError('Could not connect to Active Directory')
            setUsers([])
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Search size={16} />
                Search Active Directory
            </h4>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter name or username..."
                    className="flex-1 p-2 border border-blue-300 rounded-md text-slate-900 text-sm"
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Search
                </button>
            </div>

            {error && (
                <p className="text-red-600 text-sm mb-2">{error}</p>
            )}

            {users.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                    {users.map((user) => (
                        <div
                            key={user.dn}
                            className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                            <div>
                                <p className="font-medium text-slate-800 text-sm">{user.cn}</p>
                                <p className="text-xs text-slate-500">{user.department || user.sAMAccountName}</p>
                            </div>
                            <button
                                onClick={() => onSelectUser(user)}
                                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Add to staff"
                            >
                                <UserPlus size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {users.length === 0 && query && !isSearching && !error && (
                <p className="text-slate-500 text-sm italic">No users found.</p>
            )}
        </div>
    )
}
