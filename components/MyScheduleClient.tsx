'use client'

import { useState, useEffect } from 'react'
import { getStaffSchedule, getAllStaffNames } from '@/lib/actions'
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, Clock, Filter, Search, Star, User } from 'lucide-react'

interface ShiftData {
    id: number
    date: Date
    endDate?: Date | null
    notes?: string | null
    isFixed: boolean
    doctor: {
        id: number
        name: string
        department: { name: string; color: string }
        specialty?: { name: string } | null
    }
    tier: { name: string; level: number }
    specialty?: { name: string } | null
}

interface ScheduleResult {
    shifts: ShiftData[]
    nextShiftIndex: number | null
    totalCount: number
}

interface StaffOption {
    id: number
    name: string
    department: { name: string }
}

export function MyScheduleClient() {
    const [staffName, setStaffName] = useState('')
    const [staffList, setStaffList] = useState<StaffOption[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showPast, setShowPast] = useState(true)
    const [showFuture, setShowFuture] = useState(true)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [schedule, setSchedule] = useState<ScheduleResult | null>(null)
    const [loading, setLoading] = useState(false)

    // Load staff list on mount
    useEffect(() => {
        getAllStaffNames().then(setStaffList)
    }, [])

    // Filter staff suggestions
    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(staffName.toLowerCase())
    ).slice(0, 8)

    // Search for schedule
    const searchSchedule = async () => {
        if (!staffName.trim()) return

        setLoading(true)
        try {
            const result = await getStaffSchedule({
                staffName: staffName.trim(),
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
                showPast: !dateFrom && !dateTo ? showPast : undefined,
                showFuture: !dateFrom && !dateTo ? showFuture : undefined
            })
            setSchedule(result as ScheduleResult)
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return today.toDateString() === new Date(date).toDateString()
    }

    const isPast = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return new Date(date) < today
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Search Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search size={20} className="text-blue-600" />
                    Find Your Schedule
                </h2>

                {/* Staff Search */}
                <div className="relative mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Staff Name
                        {staffList.length > 0 && (
                            <span className="ml-2 text-xs text-slate-400">({staffList.length} staff available)</span>
                        )}
                    </label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={staffName}
                            onChange={(e) => {
                                setStaffName(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={staffList.length > 0 ? "Start typing to search staff..." : "Loading staff..."}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && (staffName || staffList.length > 0) && filteredStaff.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {filteredStaff.map((staff) => (
                                <button
                                    key={staff.id}
                                    onClick={() => {
                                        setStaffName(staff.name)
                                        setShowSuggestions(false)
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between"
                                >
                                    <span className="font-medium text-slate-800">{staff.name}</span>
                                    <span className="text-xs text-slate-400">{staff.department.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            <Filter size={14} className="inline mr-1" />
                            Quick Filter
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPast(!showPast)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${showPast
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}
                            >
                                <ChevronLeft size={16} />
                                Past
                            </button>
                            <button
                                onClick={() => setShowFuture(!showFuture)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${showFuture
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}
                            >
                                Future
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={searchSchedule}
                    disabled={loading || !staffName.trim()}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <CalendarDays size={20} />
                            View Schedule
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {schedule && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800">
                            Schedule for "{staffName}"
                        </h3>
                        <p className="text-sm text-slate-500">
                            {schedule.totalCount} shift{schedule.totalCount !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {schedule.shifts.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No shifts found for this staff member.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {schedule.shifts.map((shift, index) => {
                                const isNext = index === schedule.nextShiftIndex
                                const past = isPast(shift.date)
                                const today = isToday(shift.date)

                                return (
                                    <div
                                        key={shift.id}
                                        className={`p-4 transition-colors ${isNext
                                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500'
                                            : today
                                                ? 'bg-green-50 border-l-4 border-l-green-500'
                                                : past
                                                    ? 'bg-slate-50 opacity-75'
                                                    : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center">
                                                    <Calendar
                                                        size={20}
                                                        className={isNext ? 'text-amber-600' : today ? 'text-green-600' : past ? 'text-slate-400' : 'text-blue-600'}
                                                    />
                                                    {isNext && (
                                                        <Star size={14} className="text-amber-500 mt-1 fill-amber-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${isNext ? 'text-amber-800' : today ? 'text-green-800' : past ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {formatDate(shift.date)}
                                                        {shift.endDate && shift.endDate !== shift.date && (
                                                            <span className="font-normal"> → {formatDate(shift.endDate)}</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span
                                                            className="px-2 py-0.5 rounded text-xs font-medium"
                                                            style={{
                                                                backgroundColor: shift.doctor.department.color + '20',
                                                                color: shift.doctor.department.color
                                                            }}
                                                        >
                                                            {shift.doctor.department.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {shift.tier.name}
                                                        </span>
                                                        {shift.specialty && (
                                                            <span className="text-xs text-slate-400">
                                                                • {shift.specialty.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {shift.notes && (
                                                        <p className="text-xs text-slate-400 mt-1 italic">{shift.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {isNext && (
                                                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                        NEXT UP
                                                    </span>
                                                )}
                                                {today && !isNext && (
                                                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                                        TODAY
                                                    </span>
                                                )}
                                                {shift.isFixed && (
                                                    <span className="text-xs text-slate-400">Fixed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
