
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.update({
        where: { username: 'm.almusheifri' },
        data: { departmentId: 10 } // Medical
    })
    console.log('Updated user:', user)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
