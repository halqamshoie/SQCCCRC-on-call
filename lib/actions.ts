'use server'

import { prisma } from './prisma'

export async function getOnCallStaff(filters?: {
    departmentId?: number
    specialtyId?: number
    tierId?: number
    date?: Date
}) {
    const targetDate = filters?.date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        // Query for both:
        // 1. Regular shifts on this date (including date ranges)
        // 2. Fixed shifts (show every day)
        const shifts = await prisma.shift.findMany({
            where: {
                OR: [
                    // Regular shifts on this date
                    {
                        date: {
                            lte: endOfDay
                        },
                        OR: [
                            { endDate: { gte: startOfDay } },
                            { endDate: null, date: { gte: startOfDay } }
                        ],
                        isFixed: false
                    },
                    // Fixed shifts - show every day
                    {
                        isFixed: true
                    }
                ],
                ...(filters?.specialtyId && { specialtyId: filters.specialtyId }),
                ...(filters?.tierId && { tierId: filters.tierId }),
                ...(filters?.departmentId && {
                    doctor: {
                        departmentId: filters.departmentId
                    }
                })
            },
            include: {
                doctor: {
                    include: {
                        department: true,
                        specialty: true,
                        defaultTier: true
                    }
                },
                specialty: true,
                tier: {
                    include: {
                        escalationTier: true
                    }
                }
            },
            orderBy: [
                { tier: { level: 'asc' } },
                { specialty: { name: 'asc' } }
            ]
        })
        return shifts
    } catch (error) {
        console.error('Failed to fetch shifts:', error)
        return []
    }
}

export async function getOnCallStaffGroupedByDepartment(date?: Date) {
    const shifts = await getOnCallStaff({ date })

    // Group by department and specialty
    const grouped = shifts.reduce((acc, shift) => {
        const deptId = shift.doctor.department.id
        const deptName = shift.doctor.department.name
        const specId = shift.specialty?.id || 0
        const specName = shift.specialty?.name || 'General'

        if (!acc[deptId]) {
            acc[deptId] = {
                department: shift.doctor.department,
                specialties: {}
            }
        }

        if (!acc[deptId].specialties[specId]) {
            acc[deptId].specialties[specId] = {
                specialty: shift.specialty,
                shifts: []
            }
        }

        acc[deptId].specialties[specId].shifts.push(shift)
        return acc
    }, {} as any)

    return grouped
}

export async function getEmergencyCodes() {
    try {
        return await prisma.emergencyCode.findMany({
            orderBy: { id: 'asc' }
        })
    } catch (error) {
        console.error('Failed to fetch codes:', error)
        return []
    }
}

export async function getShiftHistory(filters: {
    startDate: Date
    endDate: Date
    departmentId?: number
    specialtyId?: number
}) {
    try {
        const shifts = await prisma.shift.findMany({
            where: {
                date: {
                    gte: filters.startDate,
                    lte: filters.endDate
                },
                ...(filters.specialtyId && { specialtyId: filters.specialtyId }),
                ...(filters.departmentId && {
                    doctor: {
                        departmentId: filters.departmentId
                    }
                })
            },
            include: {
                doctor: {
                    include: {
                        department: true,
                        specialty: true
                    }
                },
                specialty: true,
                tier: true
            },
            orderBy: [
                { date: 'desc' },
                { tier: { level: 'asc' } }
            ]
        })
        return shifts
    } catch (error) {
        console.error('Failed to fetch shift history:', error)
        return []
    }
}

export async function getShiftStatistics(startDate: Date, endDate: Date, departmentId?: number) {
    try {
        // Get all shifts in range (filtered by department if provided)
        const shifts = await prisma.shift.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                ...(departmentId && {
                    doctor: {
                        departmentId: departmentId
                    }
                })
            },
            include: {
                doctor: {
                    include: { department: true }
                },
                tier: true
            }
        })

        // Group by department
        const byDepartment: Record<string, { name: string; count: number; color: string }> = {}

        for (const shift of shifts) {
            const deptName = shift.doctor.department.name
            if (!byDepartment[deptName]) {
                byDepartment[deptName] = {
                    name: deptName,
                    count: 0,
                    color: shift.doctor.department.color || '#3B82F6'
                }
            }
            byDepartment[deptName].count++
        }

        // Get top staff by shifts
        const byStaff: Record<number, { name: string; department: string; count: number }> = {}
        for (const shift of shifts) {
            const docId = shift.doctor.id
            if (!byStaff[docId]) {
                byStaff[docId] = {
                    name: shift.doctor.name,
                    department: shift.doctor.department.name,
                    count: 0
                }
            }
            byStaff[docId].count++
        }

        return {
            totalShifts: shifts.length,
            byDepartment: Object.values(byDepartment).sort((a, b) => b.count - a.count),
            topStaff: Object.values(byStaff).sort((a, b) => b.count - a.count).slice(0, 10)
        }
    } catch (error) {
        console.error('Failed to fetch shift statistics:', error)
        return { totalShifts: 0, byDepartment: [], topStaff: [] }
    }
}

/**
 * Get shifts for a specific staff member with optional date range
 */
export async function getStaffSchedule(filters: {
    staffName?: string
    dateFrom?: Date
    dateTo?: Date
    showPast?: boolean
    showFuture?: boolean
}) {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Build where clause with special handling for fixed shifts
        // Fixed shifts should always be included regardless of date filters
        const whereClause: any = {}

        // Staff name filter (case-insensitive partial match)
        if (filters.staffName) {
            whereClause.doctor = {
                name: {
                    contains: filters.staffName,
                    mode: 'insensitive'
                }
            }
        }

        // Build date filter for non-fixed shifts
        let dateCondition: any = {}
        if (filters.dateFrom && filters.dateTo) {
            dateCondition = {
                date: {
                    gte: filters.dateFrom,
                    lte: filters.dateTo
                }
            }
        } else if (filters.showPast && !filters.showFuture) {
            dateCondition = { date: { lt: today } }
        } else if (filters.showFuture && !filters.showPast) {
            dateCondition = { date: { gte: today } }
        }

        // Use OR to include: (non-fixed shifts matching date filter) OR (all fixed shifts)
        if (Object.keys(dateCondition).length > 0) {
            whereClause.OR = [
                { ...dateCondition, isFixed: false },
                { isFixed: true }
            ]
        }
        // If no date filter, all shifts (including fixed) will be returned

        const shifts = await prisma.shift.findMany({
            where: whereClause,
            include: {
                doctor: {
                    include: {
                        department: true,
                        specialty: true
                    }
                },
                specialty: true,
                tier: true
            },
            orderBy: { date: 'asc' }
        })

        // Find the next upcoming shift (closest date >= today)
        const nextShiftIndex = shifts.findIndex(s => new Date(s.date) >= today)

        return {
            shifts,
            nextShiftIndex: nextShiftIndex >= 0 ? nextShiftIndex : null,
            totalCount: shifts.length
        }
    } catch (error) {
        console.error('Failed to fetch staff schedule:', error)
        return { shifts: [], nextShiftIndex: null, totalCount: 0 }
    }
}

/**
 * Get all doctors/staff for search autocomplete
 */
export async function getAllStaffNames() {
    try {
        const doctors = await prisma.doctor.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                department: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        })
        return doctors
    } catch (error) {
        console.error('Failed to fetch staff names:', error)
        return []
    }
}

/**
 * Get schedule for current logged-in user by matching displayName to doctor name
 */
export async function getMySchedule(userDisplayName: string) {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Find doctor matching the user's display name
        // Try multiple strategies: exact match, contains match, word-based match
        let doctor = await prisma.doctor.findFirst({
            where: {
                name: userDisplayName,
                isActive: true
            },
            select: { id: true, name: true }
        })

        // Fallback 1: try contains match if exact match fails
        if (!doctor) {
            doctor = await prisma.doctor.findFirst({
                where: {
                    name: {
                        contains: userDisplayName
                    },
                    isActive: true
                },
                select: { id: true, name: true }
            })
        }

        // Fallback 2: word-based matching - all words from displayName must be in doctor name
        // This handles cases like "Muhammad Yaqut" matching "Muhammad Abdeltawab Yaqut Hasan"
        if (!doctor) {
            const displayNameWords = userDisplayName.toLowerCase().split(/\s+/).filter(w => w.length > 1)

            if (displayNameWords.length > 0) {
                // Get all active doctors and filter by word matching
                const allDoctors = await prisma.doctor.findMany({
                    where: { isActive: true },
                    select: { id: true, name: true }
                })

                doctor = allDoctors.find(d => {
                    const doctorNameLower = d.name.toLowerCase()
                    // All words from displayName must be present in doctor name
                    return displayNameWords.every(word => doctorNameLower.includes(word))
                }) || null
            }
        }

        if (!doctor) {
            return {
                found: false,
                doctorName: null,
                shifts: [],
                nextShiftIndex: null,
                totalCount: 0
            }
        }

        // Get all shifts for this doctor
        const shifts = await prisma.shift.findMany({
            where: {
                doctorId: doctor.id
            },
            include: {
                doctor: {
                    include: {
                        department: true,
                        specialty: true
                    }
                },
                specialty: true,
                tier: true
            },
            orderBy: { date: 'asc' }
        })

        // Find the next upcoming shift
        const nextShiftIndex = shifts.findIndex(s => new Date(s.date) >= today)

        return {
            found: true,
            doctorName: doctor.name,
            shifts,
            nextShiftIndex: nextShiftIndex >= 0 ? nextShiftIndex : null,
            totalCount: shifts.length
        }
    } catch (error) {
        console.error('Failed to fetch my schedule:', error)
        return { found: false, doctorName: null, shifts: [], nextShiftIndex: null, totalCount: 0 }
    }
}

