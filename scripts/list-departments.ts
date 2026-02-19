
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const departments = await prisma.department.findMany()
    console.log('Departments count:', departments.length)

    const users = await prisma.user.findMany({
        include: { department: true }
    })
    console.log('Users with department:', JSON.stringify(users, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
