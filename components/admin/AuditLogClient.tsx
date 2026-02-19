'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Clock, User, FileText, Loader2 } from 'lucide-react'

type AuditEntry = {
    id: number
    action: string
    entityType: string
    entityId: number
    userId: string
    userName: string
    details: string | null
    createdAt: string
}

type AuditResponse = {
    logs: AuditEntry[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
    CREATE_SHIFT: 'bg-green-100 text-green-800',
    UPDATE_SHIFT: 'bg-blue-100 text-blue-800',
    DELETE_SHIFT: 'bg-red-100 text-red-800',
    CREATE_DOCTOR: 'bg-green-100 text-green-800',
    UPDATE_DOCTOR: 'bg-blue-100 text-blue-800',
    DELETE_DOCTOR: 'bg-red-100 text-red-800',
    TOGGLE_DOCTOR_STATUS: 'bg-amber-100 text-amber-800',
    CREATE_SWAP_REQUEST: 'bg-purple-100 text-purple-800',
    APPROVE_SWAP: 'bg-green-100 text-green-800',
    REJECT_SWAP: 'bg-red-100 text-red-800',
    CANCEL_SWAP: 'bg-slate-100 text-slate-800',
    SEND_NOTIFICATIONS: 'bg-indigo-100 text-indigo-800',
}

const ACTION_LABELS: Record<string, string> = {
    CREATE_SHIFT: 'Created Shift',
    UPDATE_SHIFT: 'Updated Shift',
    DELETE_SHIFT: 'Deleted Shift',
    CREATE_DOCTOR: 'Added Staff',
    UPDATE_DOCTOR: 'Updated Staff',
    DELETE_DOCTOR: 'Deleted Staff',
    TOGGLE_DOCTOR_STATUS: 'Toggled Status',
    CREATE_SWAP_REQUEST: 'Swap Request',
    APPROVE_SWAP: 'Approved Swap',
    REJECT_SWAP: 'Rejected Swap',
    CANCEL_SWAP: 'Cancelled Swap',
    SEND_NOTIFICATIONS: 'Sent Notifications',
}

const ENTITY_ICONS: Record<string, string> = {
    Shift: '📅',
    Doctor: '👤',
    Department: '🏢',
    SwapRequest: '🔄',
    Notification: '🔔',
}

export function AuditLogClient() {
    const [logs, setLogs] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [actionFilter, setActionFilter] = useState('')
    const [entityFilter, setEntityFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    async function fetchLogs() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            if (actionFilter) params.set('action', actionFilter)
            if (entityFilter) params.set('entityType', entityFilter)
            if (searchQuery) params.set('search', searchQuery)

            const res = await fetch(`/api/audit-log?${params}`)
            const data: AuditResponse = await res.json()
            setLogs(data.logs)
            setTotalPages(data.totalPages)
            setTotal(data.total)
        } catch (err) {
            console.error('Failed to fetch audit logs:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, actionFilter, entityFilter])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            fetchLogs()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    function formatDetails(details: string | null): string {
        if (!details) return ''
        try {
            const parsed = JSON.parse(details)
            // Pretty print key details
            const parts: string[] = []
            if (parsed.name) parts.push(`Name: ${parsed.name}`)
            if (parsed.doctorId) parts.push(`Staff ID: ${parsed.doctorId}`)
            if (parsed.date) parts.push(`Date: ${parsed.date}`)
            if (parsed.isActive !== undefined) parts.push(`Active: ${parsed.isActive}`)
            if (parsed.changes) {
                const changes = parsed.changes
                Object.keys(changes).forEach(key => {
                    if (changes[key] !== undefined) {
                        parts.push(`${key}: ${changes[key]}`)
                    }
                })
            }
            return parts.join(' • ') || JSON.stringify(parsed)
        } catch {
            return details
        }
    }

    function formatTime(dateStr: string) {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const actionOptions = [
        'CREATE_SHIFT', 'UPDATE_SHIFT', 'DELETE_SHIFT',
        'CREATE_DOCTOR', 'UPDATE_DOCTOR', 'DELETE_DOCTOR', 'TOGGLE_DOCTOR_STATUS',
        'CREATE_SWAP_REQUEST', 'APPROVE_SWAP', 'REJECT_SWAP', 'CANCEL_SWAP',
        'SEND_NOTIFICATIONS'
    ]

    const entityOptions = ['Shift', 'Doctor', 'Department', 'SwapRequest', 'Notification']

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by user..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={actionFilter}
                            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
                            className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                        >
                            <option value="">All Actions</option>
                            {actionOptions.map(a => (
                                <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <select
                        value={entityFilter}
                        onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="">All Entities</option>
                        {entityOptions.map(e => (
                            <option key={e} value={e}>{ENTITY_ICONS[e]} {e}</option>
                        ))}
                    </select>

                    {(actionFilter || entityFilter || searchQuery) && (
                        <button
                            onClick={() => { setActionFilter(''); setEntityFilter(''); setSearchQuery(''); setPage(1) }}
                            className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                            Clear Filters
                        </button>
                    )}

                    <span className="text-xs text-slate-500 ml-auto">
                        {total} {total === 1 ? 'entry' : 'entries'}
                    </span>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-slate-400" size={24} />
                        <span className="ml-2 text-sm text-slate-500">Loading audit log...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No audit log entries found.</p>
                        <p className="text-xs text-slate-400 mt-1">Actions will appear here as admin operations are performed.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-36">Time</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-44">Action</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-36">Entity</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-44">User</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <Clock size={13} />
                                            <span className="text-xs" title={new Date(log.createdAt).toLocaleString()}>
                                                {formatTime(log.createdAt)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                                            {ACTION_LABELS[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-600">
                                            {ENTITY_ICONS[log.entityType] || '📄'} {log.entityType} #{log.entityId}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <User size={13} className="text-slate-400" />
                                            <span className="text-xs font-medium text-slate-700">{log.userName}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">{log.userId}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500 break-all">
                                            {formatDetails(log.details)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
