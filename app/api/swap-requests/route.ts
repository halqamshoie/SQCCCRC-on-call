import { NextRequest, NextResponse } from 'next/server'
import { getSwapRequests } from '@/lib/swap-actions'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')

    const result = await getSwapRequests({ status, page })
    return NextResponse.json(result)
}
