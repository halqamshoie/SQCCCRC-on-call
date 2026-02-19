import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TARGET_TIERS = [
    { name: '1st On Call', level: 1, displayOrder: 1 },
    { name: '2nd On Call', level: 2, displayOrder: 2 },
    { name: '3rd On Call / Consultant', level: 3, displayOrder: 3 }
]

async function configureTiers() {
    console.log('Configuring tiers for all clinical departments...')

    // 1. Get all clinical departments
    const clinicalDepts = await prisma.department.findMany({
        where: { isClinical: true },
        include: { specialties: true }
    })

    console.log(`Found ${clinicalDepts.length} clinical departments.`)

    for (const dept of clinicalDepts) {
        console.log(`Processing Department: ${dept.name}`)

        let specialties = dept.specialties

        // If no specialty exists, create a "General" one
        if (specialties.length === 0) {
            console.log(`  - No specialty found. Creating 'General'...`)
            const general = await prisma.specialty.create({
                data: {
                    name: 'General',
                    departmentId: dept.id
                }
            })
            specialties = [general]
        }

        // For each specialty, ensure tiers exist
        for (const specialty of specialties) {
            console.log(`  - Specialty: ${specialty.name}`)

            for (const tierTemplate of TARGET_TIERS) {
                // Check if tier exists
                const existingTier = await prisma.onCallTier.findFirst({
                    where: {
                        specialtyId: specialty.id,
                        name: tierTemplate.name
                    }
                })

                if (existingTier) {
                    // Update if needed (e.g. ensure level/order is correct)
                    await prisma.onCallTier.update({
                        where: { id: existingTier.id },
                        data: {
                            level: tierTemplate.level,
                            displayOrder: tierTemplate.displayOrder
                        }
                    })
                    // console.log(`    - Updated tier: ${tierTemplate.name}`)
                } else {
                    // Create new tier
                    await prisma.onCallTier.create({
                        data: {
                            name: tierTemplate.name,
                            level: tierTemplate.level,
                            displayOrder: tierTemplate.displayOrder,
                            specialtyId: specialty.id,
                            responseTimeMinutes: 30 // Default SLA
                        }
                    })
                    console.log(`    - Created tier: ${tierTemplate.name}`)
                }
            }
        }
    }
}

configureTiers()
    .then(() => {
        console.log('Configuration completed successfully.')
        process.exit(0)
    })
    .catch((e) => {
        console.error('Error configuring tiers:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
