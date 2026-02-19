import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken, unauthorizedResponse } from '@/lib/mobile-middleware'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyMobileToken(request)
        if (!user) return unauthorizedResponse()

        // Find the doctor record matching this user's displayName
        const doctor = await prisma.doctor.findFirst({
            where: {
                name: { contains: user.displayName }
            },
            include: {
                department: true
            }
        })

        if (!doctor) {
            return NextResponse.json({
                upcoming: [],
                past: [],
                message: 'No staff profile linked to your account'
            })
        }

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        // Get upcoming shifts (next 60 days)
        const futureLimit = new Date()
        futureLimit.setDate(futureLimit.getDate() + 60)

        const upcoming = await prisma.shift.findMany({
            where: {
                doctorId: doctor.id,
                date: { gte: now, lte: futureLimit }
            },
            include: {
                tier: true,
                specialty: true,
                doctor: { include: { department: true } }
            },
            orderBy: { date: 'asc' }
        })

        // Get past shifts (last 30 days)
        const pastLimit = new Date()
        pastLimit.setDate(pastLimit.getDate() - 30)

        const past = await prisma.shift.findMany({
            where: {
                doctorId: doctor.id,
                date: { gte: pastLimit, lt: now }
            },
            include: {
                tier: true,
                specialty: true,
                doctor: { include: { department: true } }
            },
            orderBy: { date: 'desc' },
            take: 20
        })

        const formatShift = (s: any) => ({
            id: s.id,
            date: s.date.toISOString().split('T')[0],
            endDate: s.endDate ? s.endDate.toISOString().split('T')[0] : null,
            tier: s.tier?.name || 'Unknown Tier',
            tierLevel: s.tier?.level || 0,
            specialty: s.specialty?.name || null,
            department: s.doctor.department.name,
            departmentColor: s.doctor.department.color,
            startTime: s.startTime,
            endTime: s.endTime,
            isBackup: s.isBackup,
            notes: s.notes,
        })

        return NextResponse.json({
            staffName: doctor.name,
            upcoming: upcoming.map(formatShift),
            past: past.map(formatShift),
        })
    } catch (error: any) {
        console.error('Mobile shifts error:', error)
        return NextResponse.json({ error: 'Failed to fetch shifts', details: error.message }, { status: 500 })
    }
}
