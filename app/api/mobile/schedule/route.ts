import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken, unauthorizedResponse } from '@/lib/mobile-middleware'

export async function GET(request: NextRequest) {
    const user = await verifyMobileToken(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    // Default to today
    const targetDate = dateStr ? new Date(dateStr) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const shifts = await prisma.shift.findMany({
        where: {
            OR: [
                {
                    isFixed: false,
                    date: { gte: targetDate, lt: nextDay }
                },
                {
                    isFixed: true,
                    date: { lte: targetDate },
                    OR: [
                        { endDate: null },
                        { endDate: { gte: targetDate } }
                    ]
                }
            ]
        },
        include: {
            doctor: {
                include: {
                    department: true,
                    specialty: true
                }
            },
            tier: true,
            specialty: true
        },
        orderBy: [
            { doctor: { department: { isClinical: 'desc' } } },
            { doctor: { department: { name: 'asc' } } },
            { tier: { level: 'asc' } }
        ]
    })

    // Group by department
    const grouped: Record<string, any> = {}
    for (const shift of shifts) {
        const deptName = shift.doctor.department.name
        const deptColor = shift.doctor.department.color
        if (!grouped[deptName]) {
            grouped[deptName] = {
                department: deptName,
                color: deptColor,
                isClinical: shift.doctor.department.isClinical,
                staff: []
            }
        }
        grouped[deptName].staff.push({
            id: shift.id,
            name: shift.doctor.name,
            tier: shift.tier.name,
            tierLevel: shift.tier.level,
            specialty: shift.specialty?.name || shift.doctor.specialty?.name || null,
            phone: shift.doctor.gsmCccrc || shift.doctor.gsmPersonal || null,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isBackup: shift.isBackup,
            notes: shift.notes,
        })
    }

    return NextResponse.json({
        date: targetDate.toISOString().split('T')[0],
        departments: Object.values(grouped),
        totalStaff: shifts.length
    })
}
