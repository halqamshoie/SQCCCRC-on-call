'use server'

import { getCurrentUser } from './auth'
import { redirect } from 'next/navigation'

/**
 * Check if current user has required role
 */
export async function requireRole(allowedRoles: string[]) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    if (!allowedRoles.includes(user.role)) {
        // If user is just a regular USER, they shouldn't be in admin at all
        if (user.role === 'USER') {
            redirect('/')
        }

        // Otherwise redirect to dashboard if insufficient permissions
        redirect('/admin')
    }

    return user
}

/**
 * Check if current user is ADMIN
 */
export async function requireAdmin() {
    return requireRole(['ADMIN'])
}

/**
 * Check if current user is ADMIN or COORDINATOR
 */
export async function requireAdminOrCoordinator() {
    return requireRole(['ADMIN', 'COORDINATOR'])
}
