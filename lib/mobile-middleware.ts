import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_in_production'

export interface MobileUser {
    id: number
    username: string
    displayName: string
    role: string
    departmentId: number | null
}

/**
 * Generate a JWT token for the mobile app
 */
export function generateMobileToken(user: MobileUser): string {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            departmentId: user.departmentId,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    )
}

/**
 * Verify a JWT token from the Authorization header and return user data
 */
export async function verifyMobileToken(request: Request): Promise<MobileUser | null> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    try {
        const payload = jwt.verify(token, JWT_SECRET) as MobileUser
        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, username: true, displayName: true, role: true, departmentId: true }
        })
        if (!user) return null
        return user
    } catch {
        return null
    }
}

/**
 * Helper to return 401 response
 */
export function unauthorizedResponse() {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
