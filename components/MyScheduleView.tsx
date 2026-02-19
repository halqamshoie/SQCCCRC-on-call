'use client'

import { useState } from 'react'
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, List, Star } from 'lucide-react'

interface ShiftData {
    id: number
    date: string | Date
    endDate?: string | Date | null
    notes?: string | null
    isFixed: boolean
    doctor: {
        id: number
        name: string
        department: { name: string; color: string }
    }
    tier: { name: string; level: number }
    specialty?: { name: string } | null
}

interface MyScheduleViewProps {
    shifts: ShiftData[]
    nextShiftIndex: number | null
    doctorName: string
}

export function MyScheduleView({ shifts, nextShiftIndex, doctorName }: MyScheduleViewProps) {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const formatShiftDate = (dateStr: string | Date) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return today.toDateString() === date.toDateString()
    }

    const isPast = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    // Helper to check if a date falls within a shift's date range
    const isDateInShiftRange = (date: Date, shift: ShiftData) => {
        const shiftStart = new Date(shift.date)
        shiftStart.setHours(0, 0, 0, 0)

        const shiftEnd = shift.endDate ? new Date(shift.endDate) : new Date(shift.date)
        shiftEnd.setHours(23, 59, 59, 999)

        const checkDate = new Date(date)
        checkDate.setHours(12, 0, 0, 0) // Mid-day to avoid timezone issues

        return checkDate >= shiftStart && checkDate <= shiftEnd
    }

    // Get all dates covered by shifts (including date ranges)
    // For fixed shifts, we consider them for "all days" - they'll show on every day
    const getShiftDatesSet = () => {
        const dates = new Set<string>()
        const fixedShiftIds = new Set<number>()

        shifts.forEach(shift => {
            if (shift.isFixed) {
                // Track fixed shifts separately - they apply to all dates
                fixedShiftIds.add(shift.id)
                return
            }

            const startDate = new Date(shift.date)
            const endDate = shift.endDate ? new Date(shift.endDate) : new Date(shift.date)

            // Add all dates in the range
            const current = new Date(startDate)
            current.setHours(0, 0, 0, 0)
            endDate.setHours(0, 0, 0, 0)

            while (current <= endDate) {
                dates.add(current.toDateString())
                current.setDate(current.getDate() + 1)
            }
        })
        return { dates, fixedShiftIds }
    }

    const { dates: shiftDates, fixedShiftIds } = getShiftDatesSet()

    // Get fixed shifts for display
    const fixedShifts = shifts.filter(s => s.isFixed)

    // Get shift for a specific date (checks if date is within any shift's range)
    const getShiftForDate = (date: Date) => {
        return shifts.find(shift => isDateInShiftRange(date, shift))
    }

    // Calendar helpers
    const getMonthDays = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDay = firstDay.getDay()

        const days: (Date | null)[] = []

        // Add empty slots for days before the first day of month
        for (let i = 0; i < startingDay; i++) {
            days.push(null)
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const days = getMonthDays(currentMonth)

    return (
        <div>
            {/* View Toggle */}
            <div className="flex justify-center mb-6">
                <div className="inline-flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        <List size={18} />
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'calendar'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        <Calendar size={18} />
                        Calendar View
                    </button>
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg">
                            Schedule for {doctorName}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {shifts.length} shift{shifts.length !== 1 ? 's' : ''} total
                        </p>
                    </div>

                    {shifts.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No shifts scheduled yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {shifts.map((shift, index) => {
                                const isNext = index === nextShiftIndex
                                const shiftDate = new Date(shift.date)
                                const shiftEndDate = shift.endDate ? new Date(shift.endDate) : shiftDate
                                // A shift is past only if its end date is before today AND it's not fixed
                                const past = shift.isFixed ? false : isPast(shiftEndDate)
                                const todayShift = isToday(shiftDate) || (shiftDate <= new Date() && shiftEndDate >= new Date(new Date().setHours(0, 0, 0, 0)))

                                return (
                                    <div
                                        key={shift.id}
                                        className={`p-4 transition-colors ${isNext
                                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500'
                                            : todayShift
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
                                                        className={isNext ? 'text-amber-600' : todayShift ? 'text-green-600' : past ? 'text-slate-400' : 'text-blue-600'}
                                                    />
                                                    {isNext && (
                                                        <Star size={14} className="text-amber-500 mt-1 fill-amber-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${isNext ? 'text-amber-800' : todayShift ? 'text-green-800' : past ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {formatShiftDate(shift.date)}
                                                        {shift.endDate && new Date(shift.endDate).toDateString() !== new Date(shift.date).toDateString() && (
                                                            <span className="font-normal"> → {formatShiftDate(shift.endDate)}</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                                                {todayShift && !isNext && (
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

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Calendar Header */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 flex items-center justify-between">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <h3 className="font-bold text-slate-800 text-lg">{monthName}</h3>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 border-b border-slate-100">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-2 text-center text-xs font-bold text-slate-500 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                        {days.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="p-2 min-h-[80px] bg-slate-50" />
                            }

                            const hasShift = shiftDates.has(date.toDateString())
                            const shift = hasShift ? getShiftForDate(date) : null
                            const today = isToday(date)
                            const past = isPast(date)
                            const isNextShift = shift && shifts.indexOf(shift) === nextShiftIndex

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`p-2 min-h-[80px] border-b border-r border-slate-100 transition-colors ${today
                                        ? 'bg-blue-50'
                                        : hasShift
                                            ? isNextShift
                                                ? 'bg-amber-50'
                                                : past
                                                    ? 'bg-slate-50'
                                                    : 'bg-green-50'
                                            : ''
                                        }`}
                                >
                                    <div className={`text-sm font-medium mb-1 ${today
                                        ? 'text-blue-600'
                                        : past
                                            ? 'text-slate-400'
                                            : 'text-slate-700'
                                        }`}>
                                        {date.getDate()}
                                        {today && (
                                            <span className="ml-1 text-[10px] font-bold text-blue-500">TODAY</span>
                                        )}
                                    </div>

                                    {hasShift && shift && (
                                        <div
                                            className={`text-[10px] px-1.5 py-1 rounded font-medium ${shift.isFixed
                                                ? 'bg-purple-500 text-white'
                                                : isNextShift
                                                    ? 'bg-amber-500 text-white animate-pulse'
                                                    : past
                                                        ? 'bg-slate-200 text-slate-500'
                                                        : 'bg-green-500 text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                {isNextShift && !shift.isFixed && <Star size={10} className="fill-white" />}
                                                <span className="truncate">{shift.isFixed ? 'Fixed' : shift.tier.name}</span>
                                            </div>
                                            <div className="truncate opacity-80">
                                                {shift.doctor.department.name}
                                            </div>
                                        </div>
                                    )}

                                    {/* Show fixed shift indicator dot if there are fixed shifts */}
                                    {!hasShift && fixedShifts.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {fixedShifts.slice(0, 2).map(fs => (
                                                <div
                                                    key={fs.id}
                                                    className="w-2 h-2 rounded-full bg-purple-500"
                                                    title={`Fixed: ${fs.tier.name} - ${fs.doctor.department.name}`}
                                                />
                                            ))}
                                            {fixedShifts.length > 2 && (
                                                <span className="text-[8px] text-purple-500">+{fixedShifts.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-slate-600">Fixed (Permanent)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded"></div>
                            <span className="text-slate-600">Next On-Call</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-slate-600">Upcoming On-Call</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-slate-200 rounded"></div>
                            <span className="text-slate-600">Past On-Call</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                            <span className="text-slate-600">Today</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
