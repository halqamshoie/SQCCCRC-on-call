import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/ldap'
import { generateMobileToken } from '@/lib/mobile-middleware'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        // Try LDAP auth first, then local fallback (same logic as web login)
        let ldapUser = null
        try {
            ldapUser = await authenticateUser(username, password)
        } catch {
            // LDAP failed, try local
        }

        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            include: { department: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // If LDAP didn't work, check local password
        if (!ldapUser && user.passwordHash) {
            const valid = await bcrypt.compare(password, user.passwordHash)
            if (!valid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
            }
        } else if (!ldapUser) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const token = generateMobileToken({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            departmentId: user.departmentId,
        })

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                department: user.department?.name || null,
                departmentId: user.departmentId,
            }
        })
    } catch (error: any) {
        console.error('Mobile auth error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}
