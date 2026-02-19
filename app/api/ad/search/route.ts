import { NextRequest, NextResponse } from 'next/server'
import { searchADUsers } from '@/lib/ldap'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    try {
        const users = await searchADUsers(query)
        return NextResponse.json({ users })
    } catch (error) {
        console.error('AD Search API Error:', error)
        return NextResponse.json({ error: 'Failed to search Active Directory' }, { status: 500 })
    }
}
