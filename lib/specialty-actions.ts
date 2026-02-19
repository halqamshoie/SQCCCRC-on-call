'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export async function getSpecialtiesByDepartment(departmentId: number) {
    try {
        return await prisma.specialty.findMany({
            where: { departmentId },
            include: {
                _count: {
                    select: {
                        onCallTiers: true,
                        doctors: true,
                        shifts: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error('Failed to fetch specialties:', error)
        return []
    }
}

export async function getAllSpecialties() {
    try {
        return await prisma.specialty.findMany({
            where: { isActive: true },
            include: {
                department: true
            },
            orderBy: [
                { department: { name: 'asc' } },
                { name: 'asc' }
            ]
        })
    } catch (error) {
        console.error('Failed to fetch specialties:', error)
        return []
    }
}

export async function getSpecialtyById(id: number) {
    try {
        return await prisma.specialty.findUnique({
            where: { id },
            include: {
                department: true,
                onCallTiers: {
                    orderBy: { level: 'asc' }
                },
                doctors: true
            }
        })
    } catch (error) {
        console.error('Failed to fetch specialty:', error)
        return null
    }
}

export async function createSpecialty(data: {
    name: string
    departmentId: number
    description?: string
}) {
    try {
        const specialty = await prisma.specialty.create({
            data: {
                name: data.name,
                departmentId: data.departmentId,
                description: data.description
            }
        })
        revalidatePath('/admin/departments')
        revalidatePath('/')
        return { success: true, specialty }
    } catch (error: any) {
        console.error('Failed to create specialty:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Specialty name already exists in this department' }
        }
        return { success: false, error: 'Failed to create specialty' }
    }
}

export async function updateSpecialty(id: number, data: {
    name?: string
    description?: string
    isActive?: boolean
}) {
    try {
        const specialty = await prisma.specialty.update({
            where: { id },
            data
        })
        revalidatePath('/admin/departments')
        revalidatePath('/')
        return { success: true, specialty }
    } catch (error: any) {
        console.error('Failed to update specialty:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Specialty name already exists in this department' }
        }
        return { success: false, error: 'Failed to update specialty' }
    }
}

export async function deleteSpecialty(id: number) {
    try {
        // Soft delete
        await prisma.specialty.update({
            where: { id },
            data: { isActive: false }
        })
        revalidatePath('/admin/departments')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete specialty:', error)
        return { success: false, error: 'Failed to delete specialty' }
    }
}
