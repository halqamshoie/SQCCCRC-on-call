'use client'

import { useState } from 'react'
import { Calendar, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { ExportButtons } from './ExportButtons'

type Shift = {
    id: number
    date: string
    startTime: string | null
    endTime: string | null
    doctor: {
        name: string
        department: { name: string; color: string }
        specialty: { name: string } | null
    }
    tier: { name: string; level: number }
    specialty: { name: string } | null
}

type Department = {
    id: number
    name: string
}

type Props = {
    initialShifts: Shift[]
    departments: Department[]
    coordinatorDeptId?: number
}

export function ShiftHistoryClient({ initialShifts, departments, coordinatorDeptId }: Props) {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [departmentId, setDepartmentId] = useState<string>(coordinatorDeptId ? String(coordinatorDeptId) : '')
    const [isLoading, setIsLoading] = useState(false)
    const [page, setPage] = useState(1)
    const perPage = 10

    const fetchShifts = async () => {
        setIsLoading(true)
        try {
            // Always use coordinatorDeptId if present (enforce filtering)
            const effectiveDeptId = coordinatorDeptId ? String(coordinatorDeptId) : departmentId
            const params = new URLSearchParams({
                startDate,
                endDate,
                ...(effectiveDeptId && { departmentId: effectiveDeptId })
            })
            const res = await fetch(`/api/shifts/history?${params}`)
            const data = await res.json()
            setShifts(data)
            setPage(1)
        } catch (error) {
            console.error('Failed to fetch shifts:', error)
        }
        setIsLoading(false)
    }

    const exportCSV = () => {
        const headers = ['Date', 'Staff', 'Department', 'Specialty', 'Role', 'Start', 'End']
        const rows = shifts.map(s => [
            new Date(s.date).toLocaleDateString(),
            s.doctor.name,
            s.doctor.department.name,
            s.specialty?.name || s.doctor.specialty?.name || '-',
            s.tier.name,
            s.startTime || '-',
            s.endTime || '-'
        ])

        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `shift-history-${startDate}-to-${endDate}.csv`
        a.click()
    }

    const paginatedShifts = shifts.slice((page - 1) * perPage, page * perPage)
    const totalPages = Math.ceil(shifts.length / perPage)

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10 pr-3 py-2 border border-slate-300 rounded-md bg-white text-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Department</label>
                        <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-800 min-w-[180px]"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchShifts}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Filter size={16} />
                        {isLoading ? 'Loading...' : 'Apply Filter'}
                    </button>
                    <ExportButtons
                        startDate={startDate}
                        endDate={endDate}
                        departmentId={departmentId ? parseInt(departmentId) : undefined}
                    />
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-slate-600">
                    Showing <strong>{paginatedShifts.length}</strong> of <strong>{shifts.length}</strong> shifts
                </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Specialty</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedShifts.map((shift) => (
                                <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                        {(() => {
                                            const d = new Date(shift.date)
                                            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                            return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-800 font-semibold">
                                        {shift.doctor.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className="inline-flex items-center gap-1.5 text-sm"
                                            style={{ color: shift.doctor.department.color }}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: shift.doctor.department.color }}
                                            />
                                            {shift.doctor.department.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {shift.specialty?.name || shift.doctor.specialty?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            {shift.tier.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                        {shift.startTime || '00:00'} - {shift.endTime || '23:59'}
                                    </td>
                                </tr>
                            ))}
                            {paginatedShifts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                                        No shifts found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 flex items-center gap-1"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 flex items-center gap-1"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
