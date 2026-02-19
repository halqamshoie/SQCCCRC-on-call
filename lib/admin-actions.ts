'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { logAudit } from './audit'

export async function addDoctor(formData: FormData) {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const extension = formData.get('extension') as string
        const gsmPersonal = formData.get('gsmPersonal') as string
        const gsmCccrc = formData.get('gsmCccrc') as string
        const username = formData.get('username') as string
        const departmentId = parseInt(formData.get('departmentId') as string)
        const specialtyIdStr = formData.get('specialtyId') as string
        const specialtyId = specialtyIdStr && specialtyIdStr !== '' ? parseInt(specialtyIdStr) : null

        if (!name || !departmentId) {
            return { success: false, message: 'Name and department are required' }
        }

        // Coordinators can only add to their department
        if (user.role === 'COORDINATOR' && user.departmentId !== departmentId) {
            return { success: false, message: 'You can only add staff to your department' }
        }

        // Create the Doctor record
        const doctor = await prisma.doctor.create({
            data: {
                name,
                email,
                extension,
                gsmPersonal,
                gsmCccrc,
                departmentId,
                specialtyId,
                isActive: true
            }
        })

        await logAudit({ action: 'CREATE_DOCTOR', entityType: 'Doctor', entityId: doctor.id, details: { name, departmentId, email } })

        // If username is provided, also create a User account for login
        if (username && username.trim()) {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { username: username.trim() }
            })

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        username: username.trim(),
                        displayName: name,
                        email: email || null,
                        role: 'USER',
                        departmentId,
                        isActive: true
                    }
                })
            }
        }

        revalidatePath('/admin/doctors')
        revalidatePath('/admin/users')
        revalidatePath('/', 'layout')
        return { success: true, message: `Staff member "${name}" added successfully${username ? ' with login account' : ''}` }
    } catch (error) {
        console.error('Error adding staff:', error)
        return { success: false, message: 'Failed to add staff member' }
    }
}

export async function updateDoctor(id: number, data: {
    name?: string
    departmentId?: number
    specialtyId?: number | null
    extension?: string
    gsmPersonal?: string
    gsmCccrc?: string
    isActive?: boolean
}) {
    try {
        const user = await getCurrentUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
            return { success: false, error: 'Unauthorized' }
        }

        const currentDoctor = await prisma.doctor.findUnique({ where: { id } })
        if (!currentDoctor) return { success: false, error: 'Staff not found' }

        // Coordinators can only update staff in their department
        if (user.role === 'COORDINATOR' && currentDoctor.departmentId !== user.departmentId) {
            return { success: false, error: 'You can only manage staff in your department' }
        }

        // If changing department, Coordinators must stay within their department (which effectively means they can't change department)
        if (data.departmentId && user.role === 'COORDINATOR' && data.departmentId !== user.departmentId) {
            return { success: false, error: 'You cannot move staff to another department' }
        }

        const updateData: any = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
        if (data.specialtyId !== undefined) updateData.specialtyId = data.specialtyId
        if (data.extension !== undefined) updateData.extension = data.extension
        if (data.gsmPersonal !== undefined) updateData.gsmPersonal = data.gsmPersonal
        if (data.gsmCccrc !== undefined) updateData.gsmCccrc = data.gsmCccrc
        if (data.isActive !== undefined) updateData.isActive = data.isActive

        const doctor = await prisma.doctor.update({
            where: { id },
            data: updateData
        })

        await logAudit({ action: 'UPDATE_DOCTOR', entityType: 'Doctor', entityId: id, details: { changes: data, name: doctor.name } })

        revalidatePath('/admin/doctors')
        revalidatePath('/', 'layout')
        return { success: true, doctor }
    } catch (error) {
        console.error('Failed to update staff member:', error)
        return { success: false, error: 'Failed to update staff member' }
    }
}

export async function deleteDoctor(id: number, force: boolean = false) {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
        return { success: false, message: 'Unauthorized' }
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) return { success: false, message: 'Staff member not found' }

    if (user.role === 'COORDINATOR' && doctor.departmentId !== user.departmentId) {
        return { success: false, message: 'Unauthorized endpoint access' }
    }

    // Check for future shifts
    if (!force) {
        const futureShifts = await prisma.shift.count({
            where: {
                doctorId: id,
                date: { gte: new Date() } // Count shifts from today onwards
            }
        })

        if (futureShifts > 0) {
            return {
                success: false,
                warning: true,
                message: `This staff member has ${futureShifts} upcoming shift(s). Deleting them will remove these shifts.`
            }
        }
    }

    await prisma.doctor.delete({ where: { id } })
    await logAudit({ action: 'DELETE_DOCTOR', entityType: 'Doctor', entityId: id, details: { name: doctor.name } })
    revalidatePath('/admin/doctors')
    revalidatePath('/', 'layout') // Update public view
    return { success: true, message: 'Staff member deleted successfully' }
}

export async function toggleDoctorStatus(id: number, isActive: boolean, force: boolean = false) {
    // Check for future shifts if deactivating
    if (!isActive && !force) {
        const futureShifts = await prisma.shift.count({
            where: {
                doctorId: id,
                date: { gte: new Date() }
            }
        })

        if (futureShifts > 0) {
            return {
                success: false,
                warning: true,
                message: `This staff member has ${futureShifts} upcoming shift(s). Deactivating them will hide these shifts from the public view.`
            }
        }
    }

    const result = await updateDoctor(id, { isActive })

    if (result.success) {
        await logAudit({ action: 'TOGGLE_DOCTOR_STATUS', entityType: 'Doctor', entityId: id, details: { isActive } })
        revalidatePath('/', 'layout') // Update public view
        return { success: true, message: `Staff member ${isActive ? 'activated' : 'deactivated'} successfully` }
    }

    return { success: false, message: result.error || 'Failed to update status' }
}

export async function createShift(formData: FormData) {
    try {
        const doctorId = parseInt(formData.get('doctorId') as string)
        const tierId = parseInt(formData.get('tierId') as string)
        const specialtyIdStr = formData.get('specialtyId') as string
        const specialtyId = specialtyIdStr ? parseInt(specialtyIdStr) : undefined
        const dateStr = formData.get('date') as string // YYYY-MM-DD
        const endDateStr = formData.get('endDate') as string // YYYY-MM-DD (optional)
        const isFixed = formData.get('isFixed') === 'on'

        if (!doctorId || !tierId || !dateStr) {
            return { success: false, message: 'Doctor, tier, and date are required' }
        }

        const date = new Date(dateStr)
        date.setHours(8, 0, 0, 0) // Standardize time

        let endDate = null
        if (endDateStr) {
            endDate = new Date(endDateStr)
            endDate.setHours(23, 59, 59, 0)
        }

        const shift = await prisma.shift.create({
            data: {
                date,
                endDate,
                isFixed,
                doctor: {
                    connect: { id: doctorId }
                },
                tier: {
                    connect: { id: tierId }
                },
                ...(specialtyId && {
                    specialty: {
                        connect: { id: specialtyId }
                    }
                })
            }
        })
        await logAudit({ action: 'CREATE_SHIFT', entityType: 'Shift', entityId: shift.id, details: { doctorId, tierId, date: dateStr, endDate: endDateStr, isFixed } })
        revalidatePath('/', 'layout')
        revalidatePath('/admin')
        revalidatePath('/admin/shifts')
        return { success: true, message: 'Shift created successfully' }
    } catch (error) {
        console.error('Error creating shift:', error)
        return { success: false, message: 'Failed to create shift' }
    }
}

export async function deleteShift(id: number) {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
        throw new Error('Unauthorized')
    }

    // Coordinators can only delete shifts from their department
    if (user.role === 'COORDINATOR') {
        const shift = await prisma.shift.findUnique({
            where: { id },
            include: { doctor: true }
        })
        if (!shift || shift.doctor.departmentId !== user.departmentId) {
            throw new Error('You can only delete shifts from your department')
        }
    }

    await prisma.shift.delete({ where: { id } })
    await logAudit({ action: 'DELETE_SHIFT', entityType: 'Shift', entityId: id, details: {} })
    revalidatePath('/', 'layout')
    revalidatePath('/admin')
}

export async function updateShift(id: number, data: {
    doctorId?: number
    tierId?: number
    date?: string
    endDate?: string | null
    isFixed?: boolean
    notes?: string | null
}) {
    try {
        const user = await getCurrentUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
            return { success: false, error: 'Unauthorized' }
        }

        // Coordinators can only update shifts from their department
        if (user.role === 'COORDINATOR') {
            const shift = await prisma.shift.findUnique({
                where: { id },
                include: { doctor: true }
            })
            if (!shift || shift.doctor.departmentId !== user.departmentId) {
                return { success: false, error: 'You can only edit shifts from your department' }
            }
        }

        const updateData: any = {}

        if (data.doctorId !== undefined) updateData.doctorId = data.doctorId
        if (data.tierId !== undefined) updateData.tierId = data.tierId
        if (data.date !== undefined) {
            const date = new Date(data.date)
            date.setHours(8, 0, 0, 0)
            updateData.date = date
        }
        if (data.endDate !== undefined) {
            if (data.endDate) {
                const endDate = new Date(data.endDate)
                endDate.setHours(23, 59, 59, 0)
                updateData.endDate = endDate
            } else {
                updateData.endDate = null
            }
        }
        if (data.isFixed !== undefined) updateData.isFixed = data.isFixed
        if (data.notes !== undefined) updateData.notes = data.notes

        const shift = await prisma.shift.update({
            where: { id },
            data: updateData
        })

        await logAudit({ action: 'UPDATE_SHIFT', entityType: 'Shift', entityId: id, details: { changes: data } })

        revalidatePath('/', 'layout')
        revalidatePath('/admin')
        return { success: true, shift }
    } catch (error) {
        console.error('Failed to update shift:', error)
        return { success: false, error: 'Failed to update shift' }
    }
}

export async function toggleEmergencyCode(id: number, isActive: boolean) {
    await prisma.emergencyCode.update({
        where: { id },
        data: { isActive }
    })
    revalidatePath('/', 'layout')
    revalidatePath('/admin')
}

export async function getDepartments() {
    return await prisma.department.findMany()
}

export async function getAllDoctors(departmentId?: number) {
    const where = departmentId ? { departmentId } : {}

    return await prisma.doctor.findMany({
        where,
        include: {
            department: true,
            specialty: true
        }
    })
}

export async function getAllTiers() {
    return await prisma.onCallTier.findMany({
        include: { specialty: true },
        orderBy: [{ specialtyId: 'asc' }, { displayOrder: 'asc' }]
    })
}
