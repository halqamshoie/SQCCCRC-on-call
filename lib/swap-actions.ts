'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { logAudit } from './audit'

/**
 * Create a new shift swap request
 */
export async function createSwapRequest(data: {
    requesterShiftId: number
    targetShiftId?: number
    requesterId: number
    targetId?: number
    reason?: string
}) {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Verify the requester's shift exists
        const requesterShift = await prisma.shift.findUnique({
            where: { id: data.requesterShiftId },
            include: { doctor: true }
        })
        if (!requesterShift) return { success: false, error: 'Shift not found' }

        // Check for existing pending request for the same shift
        const existing = await prisma.shiftSwapRequest.findFirst({
            where: {
                requesterShiftId: data.requesterShiftId,
                status: 'PENDING'
            }
        })
        if (existing) return { success: false, error: 'A pending swap request already exists for this shift' }

        const request = await prisma.shiftSwapRequest.create({
            data: {
                requesterShiftId: data.requesterShiftId,
                targetShiftId: data.targetShiftId || null,
                requesterId: data.requesterId,
                targetId: data.targetId || null,
                reason: data.reason || null,
                status: 'PENDING'
            }
        })

        await logAudit({
            action: 'CREATE_SWAP_REQUEST',
            entityType: 'SwapRequest',
            entityId: request.id,
            details: {
                requester: requesterShift.doctor.name,
                shiftDate: requesterShift.date
            }
        })

        revalidatePath('/admin/swap-requests')
        return { success: true, request }
    } catch (error) {
        console.error('Error creating swap request:', error)
        return { success: false, error: 'Failed to create swap request' }
    }
}

/**
 * Get swap requests with optional status filter
 */
export async function getSwapRequests(filters?: {
    status?: string
    page?: number
}) {
    const page = filters?.page || 1
    const pageSize = 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (filters?.status) where.status = filters.status

    const [requests, total] = await Promise.all([
        prisma.shiftSwapRequest.findMany({
            where,
            include: {
                requester: {
                    include: { department: true }
                },
                target: {
                    include: { department: true }
                },
                requesterShift: {
                    include: {
                        tier: true,
                        specialty: true
                    }
                },
                targetShift: {
                    include: {
                        tier: true,
                        specialty: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize
        }),
        prisma.shiftSwapRequest.count({ where })
    ])

    return {
        requests,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    }
}

/**
 * Get count of pending swap requests (for sidebar badge)
 */
export async function getPendingSwapCount() {
    return await prisma.shiftSwapRequest.count({
        where: { status: 'PENDING' }
    })
}

/**
 * Review (approve/reject) a swap request
 */
export async function reviewSwapRequest(
    id: number,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
) {
    try {
        const user = await getCurrentUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
            return { success: false, error: 'Unauthorized' }
        }

        const request = await prisma.shiftSwapRequest.findUnique({
            where: { id },
            include: {
                requesterShift: true,
                targetShift: true,
                requester: true,
                target: true
            }
        })

        if (!request) return { success: false, error: 'Swap request not found' }
        if (request.status !== 'PENDING') return { success: false, error: 'Request is no longer pending' }

        // If approving, perform the actual swap
        if (status === 'APPROVED' && request.targetShiftId && request.targetId) {
            // Swap the doctor assignments on both shifts
            await prisma.$transaction([
                prisma.shift.update({
                    where: { id: request.requesterShiftId },
                    data: { doctorId: request.targetId }
                }),
                prisma.shift.update({
                    where: { id: request.targetShiftId },
                    data: { doctorId: request.requesterId }
                }),
                prisma.shiftSwapRequest.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                        adminNotes: adminNotes || null,
                        reviewedBy: user.username
                    }
                })
            ])
        } else if (status === 'APPROVED' && !request.targetShiftId) {
            // Open swap request - just mark as approved (admin can manually reassign)
            await prisma.shiftSwapRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    adminNotes: adminNotes || null,
                    reviewedBy: user.username
                }
            })
        } else {
            // Rejected
            await prisma.shiftSwapRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    adminNotes: adminNotes || null,
                    reviewedBy: user.username
                }
            })
        }

        await logAudit({
            action: status === 'APPROVED' ? 'APPROVE_SWAP' : 'REJECT_SWAP',
            entityType: 'SwapRequest',
            entityId: id,
            details: {
                status,
                requester: request.requester.name,
                target: request.target?.name,
                adminNotes
            }
        })

        revalidatePath('/admin/swap-requests')
        revalidatePath('/admin/shifts')
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error) {
        console.error('Error reviewing swap request:', error)
        return { success: false, error: 'Failed to process swap request' }
    }
}

/**
 * Cancel a swap request (by requester or admin)
 */
export async function cancelSwapRequest(id: number) {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const request = await prisma.shiftSwapRequest.findUnique({ where: { id } })
        if (!request) return { success: false, error: 'Request not found' }
        if (request.status !== 'PENDING') return { success: false, error: 'Only pending requests can be cancelled' }

        await prisma.shiftSwapRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })

        await logAudit({
            action: 'CANCEL_SWAP',
            entityType: 'SwapRequest',
            entityId: id,
            details: {}
        })

        revalidatePath('/admin/swap-requests')
        return { success: true }
    } catch (error) {
        console.error('Error cancelling swap request:', error)
        return { success: false, error: 'Failed to cancel request' }
    }
}

/**
 * Get all staff members for dropdown selection
 */
export async function getStaffForSwap() {
    return await prisma.doctor.findMany({
        where: { isActive: true },
        include: {
            department: true,
            shifts: {
                where: {
                    date: { gte: new Date() }
                },
                include: {
                    tier: true,
                    specialty: true
                },
                orderBy: { date: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    })
}
