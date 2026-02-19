'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export async function getDepartments() {
    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: {
                        specialties: true,
                        doctors: true
                    }
                },
                specialties: {
                    include: {
                        _count: {
                            select: {
                                onCallTiers: true,
                                doctors: true,
                                shifts: true
                            }
                        },
                        onCallTiers: {
                            select: { name: true }
                        }
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        })
        return departments
    } catch (error) {
        console.error('Failed to fetch departments:', error)
        return []
    }
}

export async function getDepartmentById(id: number) {
    try {
        return await prisma.department.findUnique({
            where: { id },
            include: {
                specialties: {
                    include: {
                        _count: {
                            select: {
                                onCallTiers: true,
                                doctors: true
                            }
                        }
                    }
                },
                doctors: true
            }
        })
    } catch (error) {
        console.error('Failed to fetch department:', error)
        return null
    }
}

export async function createDepartment(data: {
    name: string
    code: string
    color?: string
    isClinical?: boolean
    tiers?: Array<{ name: string; level: number; responseTimeMinutes: number }>
}) {
    try {
        const department = await prisma.department.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase(),
                color: data.color || '#3B82F6',
                isClinical: data.isClinical ?? true
            }
        })

        // If tiers are provided, create a "General" specialty and add tiers to it
        if (data.tiers && data.tiers.length > 0) {
            const specialty = await prisma.specialty.create({
                data: {
                    name: 'General',
                    departmentId: department.id,
                    isActive: true
                }
            })

            for (let i = 0; i < data.tiers.length; i++) {
                const tier = data.tiers[i]
                await prisma.onCallTier.create({
                    data: {
                        name: tier.name,
                        level: tier.level,
                        displayOrder: i + 1,
                        responseTimeMinutes: tier.responseTimeMinutes,
                        specialtyId: specialty.id
                    }
                })
            }
        }

        revalidatePath('/admin/departments')
        revalidatePath('/')
        return { success: true, department }
    } catch (error: any) {
        console.error('Failed to create department:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Department code already exists' }
        }
        return { success: false, error: 'Failed to create department' }
    }
}

export async function updateDepartment(id: number, data: {
    name?: string
    code?: string
    color?: string
    isClinical?: boolean
    isActive?: boolean
}) {
    try {
        const department = await prisma.department.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.code && { code: data.code.toUpperCase() }),
                ...(data.color && { color: data.color }),
                ...(data.isClinical !== undefined && { isClinical: data.isClinical }),
                ...(data.isActive !== undefined && { isActive: data.isActive })
            }
        })
        revalidatePath('/admin/departments')
        revalidatePath('/')
        return { success: true, department }
    } catch (error: any) {
        console.error('Failed to update department:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Department code already exists' }
        }
        return { success: false, error: 'Failed to update department' }
    }
}

export async function deleteDepartment(id: number) {
    try {
        // Check if already inactive - if so, do permanent delete
        const dept = await prisma.department.findUnique({ where: { id } })
        if (!dept) {
            return { success: false, error: 'Department not found' }
        }

        if (!dept.isActive) {
            // Already inactive - do permanent delete
            await prisma.department.delete({
                where: { id }
            })
            revalidatePath('/admin/departments')
            revalidatePath('/')
            return { success: true, action: 'deleted', message: 'Department permanently deleted' }
        } else {
            // First click - mark as inactive (soft delete)
            await prisma.department.update({
                where: { id },
                data: { isActive: false }
            })
            revalidatePath('/admin/departments')
            revalidatePath('/')
            return { success: true, action: 'deactivated', message: 'Department deactivated. Click again to permanently delete.' }
        }
    } catch (error: any) {
        console.error('Failed to delete department:', error)
        // Check for foreign key constraint error
        if (error.code === 'P2003') {
            return { success: false, error: 'Cannot delete: Department has associated staff or shifts. Remove them first.' }
        }
        return { success: false, error: 'Failed to delete department' }
    }
}

export async function getActiveDepartments() {
    try {
        return await prisma.department.findMany({
            where: { isActive: true },
            include: {
                specialties: {
                    where: { isActive: true }
                }
            },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error('Failed to fetch active departments:', error)
        return []
    }
}
