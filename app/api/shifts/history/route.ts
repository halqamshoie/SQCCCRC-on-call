import { NextRequest, NextResponse } from 'next/server'
import { getShiftHistory } from '@/lib/actions'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams

    const startDate = new Date(searchParams.get('startDate') || '')
    const endDate = new Date(searchParams.get('endDate') || '')
    const departmentId = searchParams.get('departmentId')

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const shifts = await getShiftHistory({
        startDate,
        endDate,
        departmentId: departmentId ? parseInt(departmentId) : undefined
    })

    return NextResponse.json(shifts)
}
