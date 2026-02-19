'use client'

import { useState } from 'react'
import { ShiftCard } from './ShiftCard'
import { Search, Filter } from 'lucide-react'

interface Shift {
    id: number
    date: string
    endDate?: string | null
    isFixed?: boolean
    notes?: string | null
    doctor: {
        id: number
        name: string
        departmentId: number
        department: { name: string; color?: string | null; isClinical?: boolean }
    }
    tier: { id: number; name: string }
    specialty?: { name: string } | null
}

interface Props {
    shifts: Shift[]
    doctors: { id: number; name: string; departmentId: number; specialty?: { name: string } | null }[]
    tiers: { id: number; name: string; specialtyId?: number | null }[]
}

export function ShiftManagementList({ shifts, doctors, tiers }: Props) {
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'fixed' | 'scheduled'>('all')

    // Filter shifts
    const filteredShifts = shifts.filter(shift => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            shift.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.doctor.department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.tier.name.toLowerCase().includes(searchTerm.toLowerCase())

        // Type filter
        let matchesType = true
        if (filterType === 'fixed') matchesType = shift.isFixed === true
        if (filterType === 'scheduled') matchesType = shift.isFixed !== true

        return matchesSearch && matchesType
    })

    // Format date consistently (no locale dependency to avoid hydration mismatch)
    const formatDateKey = (date: Date): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    }

    // Group by date
    const groupedByDate = filteredShifts.reduce((groups, shift) => {
        const dateKey = shift.isFixed ? 'Fixed (Permanent)' : formatDateKey(new Date(shift.date))
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(shift)
        return groups
    }, {} as Record<string, Shift[]>)

    // Sort date keys (Fixed first, then by date)
    const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => {
        if (a === 'Fixed (Permanent)') return -1
        if (b === 'Fixed (Permanent)') return 1
        return new Date(a).getTime() - new Date(b).getTime()
    })

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, department, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'fixed' | 'scheduled')}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                        <option value="all">All Shifts</option>
                        <option value="fixed">Fixed Only</option>
                        <option value="scheduled">Scheduled Only</option>
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="text-sm text-slate-500">
                Showing {filteredShifts.length} of {shifts.length} shifts
            </div>

            {/* Grouped Shifts */}
            {sortedDateKeys.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p className="text-lg">No shifts found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                sortedDateKeys.map(dateKey => (
                    <div key={dateKey} className="space-y-3">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className={dateKey === 'Fixed (Permanent)' ? 'text-blue-600' : ''}>
                                {dateKey}
                            </span>
                            <span className="text-xs text-slate-400 font-normal">
                                ({groupedByDate[dateKey].length} shifts)
                            </span>
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {groupedByDate[dateKey].map(shift => (
                                <ShiftCard
                                    key={shift.id}
                                    shift={shift}
                                    doctors={doctors}
                                    tiers={tiers}
                                    isEditing={editingShiftId === shift.id}
                                    onStartEdit={() => setEditingShiftId(shift.id)}
                                    onEndEdit={() => setEditingShiftId(null)}
                                    canEdit={editingShiftId === null}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
