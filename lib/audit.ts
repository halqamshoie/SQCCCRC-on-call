'use server'

import { prisma } from './prisma'
import { getCurrentUser } from './auth'

export type AuditAction =
    | 'CREATE_SHIFT' | 'UPDATE_SHIFT' | 'DELETE_SHIFT'
    | 'CREATE_DOCTOR' | 'UPDATE_DOCTOR' | 'DELETE_DOCTOR' | 'TOGGLE_DOCTOR_STATUS'
    | 'CREATE_DEPARTMENT' | 'UPDATE_DEPARTMENT' | 'DELETE_DEPARTMENT'
    | 'CREATE_SWAP_REQUEST' | 'APPROVE_SWAP' | 'REJECT_SWAP' | 'CANCEL_SWAP'
    | 'SEND_NOTIFICATIONS'

export type EntityType = 'Shift' | 'Doctor' | 'Department' | 'SwapRequest' | 'Notification'

interface AuditLogInput {
    action: AuditAction
    entityType: EntityType
    entityId: number
    details?: Record<string, any>
}

/**
 * Log an audit event. Automatically captures the current user from the session.
 */
export async function logAudit(input: AuditLogInput) {
    try {
        const user = await getCurrentUser()

        await prisma.auditLog.create({
            data: {
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                userId: user?.username || 'system',
                userName: user?.displayName || 'System',
                details: input.details ? JSON.stringify(input.details) : null,
            }
        })
    } catch (error) {
        // Don't let audit logging failures break the main operation
        console.error('Failed to log audit event:', error)
    }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
    action?: string
    entityType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    pageSize?: number
}) {
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 50
    const skip = (page - 1) * pageSize

    const where: any = {}

    if (filters?.action) where.action = filters.action
    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.userId) where.userId = filters.userId
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters?.startDate) where.createdAt.gte = filters.startDate
        if (filters?.endDate) where.createdAt.lte = filters.endDate
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.auditLog.count({ where })
    ])

    return {
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    }
}
