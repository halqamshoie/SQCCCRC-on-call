import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUsernames() {
    console.log('Fixing user accounts with email-based usernames...\n')

    // First, delete all USER role accounts (keep ADMIN and COORDINATOR)
    const deleted = await prisma.user.deleteMany({
        where: {
            role: 'USER'
        }
    })
    console.log(`Deleted ${deleted.count} USER accounts\n`)

    // Get all active doctors
    const doctors = await prisma.doctor.findMany({
        where: { isActive: true },
        include: { department: true }
    })

    console.log(`Found ${doctors.length} active staff members\n`)

    let created = 0
    let skipped = 0

    for (const doctor of doctors) {
        // Extract username from email (part before @)
        let username: string | null = null
        if (doctor.email && doctor.email.includes('@')) {
            username = doctor.email.split('@')[0].toLowerCase()
        }

        if (!username) {
            console.log(`⚠ Skipping "${doctor.name}" - no valid email`)
            skipped++
            continue
        }

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { username }
            })

            if (existingUser) {
                console.log(`◦ User "${username}" already exists`)
                skipped++
                continue
            }

            await prisma.user.create({
                data: {
                    username,
                    displayName: doctor.name,
                    email: doctor.email,
                    role: 'USER',
                    departmentId: doctor.departmentId,
                    isActive: true
                }
            })

            console.log(`✓ Created "${username}" for "${doctor.name}"`)
            created++
        } catch (error: any) {
            if (error.code === 'P2002') {
                console.log(`⚠ Username "${username}" already taken`)
                skipped++
            } else {
                console.log(`✗ Error for "${doctor.name}": ${error.message}`)
            }
        }
    }

    console.log('\n========== SUMMARY ==========')
    console.log(`✓ Created: ${created}`)
    console.log(`◦ Skipped (no email): ${skipped}`)

    await prisma.$disconnect()
}

fixUsernames().catch(console.error)
