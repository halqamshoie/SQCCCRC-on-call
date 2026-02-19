import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const codes = [
    { code: 'SECURITY', extension: '1111', color: '#C4A55A', isActive: true },
    { code: 'CODE ORANGE', extension: '2222', color: '#E67E22', isActive: true },
    { code: 'FIRE', extension: '5555', color: '#E74C3C', isActive: true },
    { code: 'CODE WHITE', extension: '6666', color: '#95A5A6', isActive: true },
    { code: 'CODE BLUE', extension: '7777', color: '#2563EB', isActive: true },
    { code: 'RAPID RESPONSE', extension: '8888', color: '#22C55E', isActive: true }
]

async function addCodes() {
    // Delete existing codes first
    await prisma.emergencyCode.deleteMany({})

    // Create new codes
    const result = await prisma.emergencyCode.createMany({
        data: codes
    })

    console.log(`Created ${result.count} emergency codes`)
}

addCodes()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
