'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export async function getTiersBySpecialty(specialtyId: number) {
    try {
        return await prisma.onCallTier.findMany({
            where: { specialtyId },
            include: {
                escalationTier: true,
                _count: {
                    select: {
                        doctors: true,
                        shifts: true
                    }
                }
            },
            orderBy: { level: 'asc' }
        })
    } catch (error) {
        console.error('Failed to fetch tiers:', error)
        return []
    }
}

export async function getTierById(id: number) {
    try {
        return await prisma.onCallTier.findUnique({
            where: { id },
            include: {
                specialty: {
                    include: {
                        department: true
                    }
                },
                escalationTier: true,
                escalatedFrom: true
            }
        })
    } catch (error) {
        console.error('Failed to fetch tier:', error)
        return null
    }
}

export async function createTier(data: {
    name: string
    level: number
    specialtyId: number
    responseTimeMinutes?: number
    escalationTierId?: number
}) {
    try {
        // Calculate display order (max + 1)
        const maxOrder = await prisma.onCallTier.findFirst({
            where: { specialtyId: data.specialtyId },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true }
        })

        const tier = await prisma.onCallTier.create({
            data: {
                name: data.name,
                level: data.level,
                displayOrder: (maxOrder?.displayOrder ?? 0) + 1,
                specialtyId: data.specialtyId,
                responseTimeMinutes: data.responseTimeMinutes,
                escalationTierId: data.escalationTierId
            }
        })
        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true, tier }
    } catch (error: any) {
        console.error('Failed to create tier:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Tier name already exists in this specialty' }
        }
        return { success: false, error: 'Failed to create tier' }
    }
}

export async function updateTier(id: number, data: {
    name?: string
    level?: number
    responseTimeMinutes?: number
    escalationTierId?: number
}) {
    try {
        const tier = await prisma.onCallTier.update({
            where: { id },
            data
        })
        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true, tier }
    } catch (error: any) {
        console.error('Failed to update tier:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'Tier name already exists in this specialty' }
        }
        return { success: false, error: 'Failed to update tier' }
    }
}

export async function deleteTier(id: number) {
    try {
        // Check if any doctors have this as their default tier
        const doctorsCount = await prisma.doctor.count({
            where: { defaultTierId: id }
        })

        if (doctorsCount > 0) {
            return { success: false, error: `Cannot delete tier: ${doctorsCount} doctor(s) have this as their default tier` }
        }

        // Check if any active shifts use this tier
        const activeShiftsCount = await prisma.shift.count({
            where: {
                tierId: id,
                date: {
                    gte: new Date()
                }
            }
        })

        if (activeShiftsCount > 0) {
            return { success: false, error: `Cannot delete tier: ${activeShiftsCount} active shift(s) use this tier` }
        }

        await prisma.onCallTier.delete({
            where: { id }
        })
        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete tier:', error)
        return { success: false, error: 'Failed to delete tier' }
    }
}

export async function reorderTiers(specialtyId: number, tierOrder: number[]) {
    try {
        // Update display order for each tier
        await Promise.all(
            tierOrder.map((tierId, index) =>
                prisma.onCallTier.update({
                    where: { id: tierId },
                    data: { displayOrder: index + 1 }
                })
            )
        )
        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to reorder tiers:', error)
        return { success: false, error: 'Failed to reorder tiers' }
    }
}

export async function createTiersFromPreset(specialtyId: number, presetTiers: Array<{
    name: string
    level: number
    responseTimeMinutes: number
}>) {
    try {
        // Create tiers
        const createdTiers = []
        for (let i = 0; i < presetTiers.length; i++) {
            const tier = await prisma.onCallTier.create({
                data: {
                    name: presetTiers[i].name,
                    level: presetTiers[i].level,
                    displayOrder: i + 1,
                    responseTimeMinutes: presetTiers[i].responseTimeMinutes,
                    specialtyId
                }
            })
            createdTiers.push(tier)
        }

        // Set up escalation chain
        for (let i = 0; i < createdTiers.length - 1; i++) {
            await prisma.onCallTier.update({
                where: { id: createdTiers[i].id },
                data: { escalationTierId: createdTiers[i + 1].id }
            })
        }

        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true, tiers: createdTiers }
    } catch (error) {
        console.error('Failed to create tiers from preset:', error)
        return { success: false, error: 'Failed to create tiers from preset' }
    }
}

export async function syncTiers(specialtyId: number, templates: Array<{
    id: string
    name: string
    level: number
    responseTime: number
}>) {
    try {
        // 1. Get existing tiers
        const existingTiers = await prisma.onCallTier.findMany({
            where: { specialtyId },
            include: {
                _count: {
                    select: {
                        doctors: true,
                        shifts: true
                    }
                }
            }
        })

        // 2. Identify tiers to keep/add/remove
        // We match based on name similarity or potentially a new metadata field if we had one
        // For now, simpler heuristic:
        // - "1st Call" matches template "1st Call"
        // - "Technologist" matches template "Technologist"

        const keptTiers = []
        const tiersToRemove = []

        // Templates that we need to ensure exist
        const remainingTemplates = [...templates]

        for (const tier of existingTiers) {
            // Find a matching template in the request
            const matchIndex = remainingTemplates.findIndex(t =>
                t.name === tier.name ||
                (t.id === '1st' && tier.name.includes('1st')) ||
                (t.id === '2nd' && tier.name.includes('2nd')) ||
                (t.id === '3rd' && tier.name.includes('3rd')) ||
                (t.id === 'consultant' && tier.name.includes('Consultant')) ||
                (t.id === 'tech' && tier.name === 'Technologist') ||
                (t.id === 'senior_tech' && tier.name === 'Senior Technologist') ||
                (t.id === 'supervisor' && tier.name.includes('Supervisor'))
            )

            if (matchIndex !== -1) {
                // Keep this tier, it's in the requested list
                keptTiers.push({ tier, template: remainingTemplates[matchIndex] })
                remainingTemplates.splice(matchIndex, 1) // Remove from needed list
            } else {
                // This tier is NOT in the requested list, mark for removal
                tiersToRemove.push(tier)
            }
        }

        // 3. Validate removal
        for (const tier of tiersToRemove) {
            if (tier._count.doctors > 0 || tier._count.shifts > 0) {
                return {
                    success: false,
                    error: `Cannot remove '${tier.name}' because it has active assignments (Docs: ${tier._count.doctors}, Shifts: ${tier._count.shifts}). Please reassign them first.`
                }
            }
        }

        // 4. Perform Removal
        for (const tier of tiersToRemove) {
            await prisma.onCallTier.delete({ where: { id: tier.id } })
        }

        // 5. Create new tiers
        const createdTiers = []
        for (const tmpl of remainingTemplates) {
            const newTier = await prisma.onCallTier.create({
                data: {
                    name: tmpl.name,
                    level: tmpl.level,
                    displayOrder: tmpl.level, // Initial guess
                    responseTimeMinutes: tmpl.responseTime,
                    specialtyId
                }
            })
            createdTiers.push(newTier)
        }

        // 6. Re-establish escalation chain based on levels
        // Combine kept (updated set) and created tiers
        const allCurrentTiers = [
            ...keptTiers.map(k => k.tier),
            ...createdTiers
        ].sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level
            // If levels match (e.g. tech levels), rely on ID or name implies order? 
            // Our templates define distinct levels usually.
            return 0
        })

        // Clear existing chains first to avoid cycles/conflicts
        await prisma.onCallTier.updateMany({
            where: { specialtyId },
            data: { escalationTierId: null }
        })

        // Link them: Level 1 -> Level 2 -> Level 3
        for (let i = 0; i < allCurrentTiers.length - 1; i++) {
            const current = allCurrentTiers[i]
            const next = allCurrentTiers[i + 1]

            // Only link if next level is actually higher (1 -> 2), not same level siblings
            if (next.level > current.level) {
                await prisma.onCallTier.update({
                    where: { id: current.id },
                    data: { escalationTierId: next.id }
                })
            }
        }

        // Also update display order
        for (let i = 0; i < allCurrentTiers.length; i++) {
            await prisma.onCallTier.update({
                where: { id: allCurrentTiers[i].id },
                data: { displayOrder: i + 1 }
            })
        }

        revalidatePath('/admin/tiers')
        revalidatePath('/')
        return { success: true }

    } catch (error) {
        console.error('Sync tiers error:', error)
        return { success: false, error: 'Internal server error during tier sync' }
    }
}
