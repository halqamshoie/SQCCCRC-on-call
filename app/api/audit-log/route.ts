import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = 50
    const skip = (page - 1) * pageSize

    const where: any = {}

    const action = searchParams.get('action')
    if (action) where.action = action

    const entityType = searchParams.get('entityType')
    if (entityType) where.entityType = entityType

    const search = searchParams.get('search')
    if (search) {
        where.OR = [
            { userName: { contains: search } },
            { userId: { contains: search } },
        ]
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

    return NextResponse.json({
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    })
}
