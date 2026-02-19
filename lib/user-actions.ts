'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'USER'

export async function getAllUsers() {
    return await prisma.user.findMany({
        orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
        include: { department: true }
    })
}

export async function getUserByUsername(username: string) {
    return await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
    })
}

export async function createUser(formData: FormData) {
    const username = (formData.get('username') as string)?.toLowerCase()
    const displayName = formData.get('displayName') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as UserRole
    const departmentIdFn = formData.get('departmentId')
    const departmentId = departmentIdFn ? parseInt(departmentIdFn as string) : null

    if (!username || !displayName) return

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) return

    await prisma.user.create({
        data: {
            username,
            displayName,
            email: email || null,
            role: role || 'USER',
            departmentId: role === 'COORDINATOR' ? departmentId : null
        }
    })

    revalidatePath('/admin/users')
}

export async function toggleUserActive(userId: number, isActive: boolean) {
    await prisma.user.update({
        where: { id: userId },
        data: { isActive }
    })
    revalidatePath('/admin/users')
}

export async function getDepartments() {
    return await prisma.department.findMany()
}

export async function updateUser(userId: number, data: {
    displayName?: string
    email?: string | null
    role?: UserRole
    departmentId?: number | null
}) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                displayName: data.displayName,
                email: data.email,
                role: data.role,
                departmentId: data.departmentId
            } as any
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Failed to update user:', error)
        return { success: false, error: 'Failed to update user. Please restart server if you see this error.' }
    }
}

export async function updateUserRole(userId: number, role: UserRole) {
    return updateUser(userId, { role })
}

export async function updateUserDepartment(userId: number, departmentId: number | null) {
    return updateUser(userId, { departmentId })
}

export async function deleteUser(userId: number) {
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/admin/users')
}

// Check if a user has admin access
export async function isAdmin(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
    })
    return user?.role === 'ADMIN' && user?.isActive === true
}

// Check if a user has at least coordinator access
export async function hasAccess(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
    })
    return user?.isActive === true && ['ADMIN', 'COORDINATOR'].includes(user?.role || '')
}

/**
 * Simple hash function for local passwords
 */
function simpleHash(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(36)
}

/**
 * Set local password for a user (for fallback auth when LDAP unavailable)
 */
export async function setUserLocalPassword(userId: number, password: string) {
    try {
        const hashedPassword = password ? simpleHash(password) : null
        await prisma.user.update({
            where: { id: userId },
            data: { localPassword: hashedPassword }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Failed to set local password:', error)
        return { success: false, error: 'Failed to set password' }
    }
}

/**
 * Check if user has local password set
 */
export async function hasLocalPassword(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { localPassword: true }
    })
    return !!user?.localPassword
}
