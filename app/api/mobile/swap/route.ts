import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken, unauthorizedResponse } from '@/lib/mobile-middleware'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyMobileToken(request)
        if (!user) return unauthorizedResponse()

        // Find doctor for current user
        console.log(`Swap fetch for: ${user.displayName} (${user.username})`)

        const doctor = await prisma.doctor.findFirst({
            where: { name: { contains: user.displayName } }
        })

        if (!doctor) {
            console.log('No doctor profile found for user')
            return NextResponse.json({ requests: [], message: 'No staff profile found' })
        }

        const requests = await prisma.shiftSwapRequest.findMany({
            where: {
                OR: [
                    { requesterId: doctor.id },
                    { targetId: doctor.id }
                ]
            },
            include: {
                requester: { include: { department: true } },
                target: { include: { department: true } },
                requesterShift: { include: { tier: true, specialty: true } },
                targetShift: { include: { tier: true, specialty: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({
            requests: requests.map(r => ({
                id: r.id,
                status: r.status,
                reason: r.reason,
                adminNotes: r.adminNotes,
                reviewedBy: r.reviewedBy,
                createdAt: r.createdAt.toISOString(),
                isRequester: r.requesterId === doctor.id,
                requester: {
                    name: r.requester.name,
                    department: r.requester.department.name,
                },
                target: r.target ? {
                    name: r.target.name,
                    department: r.target.department.name,
                } : null,
                requesterShift: {
                    date: r.requesterShift.date.toISOString().split('T')[0],
                    tier: r.requesterShift.tier.name,
                    specialty: r.requesterShift.specialty?.name || null,
                },
                targetShift: r.targetShift ? {
                    date: r.targetShift.date.toISOString().split('T')[0],
                    tier: r.targetShift.tier.name,
                    specialty: r.targetShift.specialty?.name || null,
                } : null,
            }))
        })
    } catch (error: any) {
        console.error('Error fetching swap requests:', error)
        return NextResponse.json({ error: 'Failed to fetch swap requests' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyMobileToken(request)
    if (!user) return unauthorizedResponse()

    const doctor = await prisma.doctor.findFirst({
        where: { name: { contains: user.displayName } }
    })

    if (!doctor) {
        return NextResponse.json({ error: 'No staff profile found' }, { status: 400 })
    }

    const { shiftId, targetId, reason } = await request.json()

    if (!shiftId) {
        return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    // Verify the shift belongs to this doctor
    const shift = await prisma.shift.findFirst({
        where: { id: shiftId, doctorId: doctor.id }
    })

    if (!shift) {
        return NextResponse.json({ error: 'Shift not found or does not belong to you' }, { status: 400 })
    }

    const swapRequest = await prisma.shiftSwapRequest.create({
        data: {
            requesterShiftId: shiftId,
            requesterId: doctor.id,
            targetId: targetId || null,
            reason: reason || null,
        }
    })

    return NextResponse.json({
        success: true,
        id: swapRequest.id,
        message: 'Swap request created successfully'
    })
}
