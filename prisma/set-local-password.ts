// Run with: npx tsx prisma/set-local-password.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function simpleHash(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(36)
}

async function main() {
    // Find existing admin users
    const users = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, username: true, displayName: true, localPassword: true }
    })

    console.log('Admin users found:', users.length)

    if (users.length > 0) {
        // Set local password for first admin
        const password = 'admin123'
        const hashedPwd = simpleHash(password)
        await prisma.user.update({
            where: { id: users[0].id },
            data: { localPassword: hashedPwd }
        })
        console.log('✅ Set local password for:', users[0].username)
        console.log('📝 Username:', users[0].username)
        console.log('🔑 Password:', password)
    } else {
        console.log('No admin users found. Creating one...')
        const password = 'admin123'
        const hashedPwd = simpleHash(password)
        await prisma.user.create({
            data: {
                username: 'admin',
                displayName: 'Administrator',
                email: 'admin@sqcccrc.om',
                role: 'ADMIN',
                localPassword: hashedPwd,
                isActive: true
            }
        })
        console.log('✅ Created admin user')
        console.log('📝 Username: admin')
        console.log('🔑 Password:', password)
    }

    await prisma.$disconnect()
}

main()
