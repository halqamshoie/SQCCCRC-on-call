import { prisma } from './lib/prisma'

async function check() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const shifts = await prisma.shift.findMany({
        where: {
            date: { gte: today, lt: tomorrow }
        },
        include: {
            doctor: {
                include: {
                    department: true,
                    specialty: true
                }
            },
            tier: true,
            specialty: true
        },
        orderBy: [
            { doctor: { department: { name: 'asc' } } },
            { tier: { level: 'asc' } }
        ]
    })

    console.log(`Total shifts: ${shifts.length}`)

    const grouped: Record<string, any> = {}
    for (const shift of shifts) {
        const deptName = shift.doctor.department.name
        const deptColor = shift.doctor.department.color
        if (!grouped[deptName]) {
            grouped[deptName] = {
                department: deptName,
                color: deptColor,
                staff: []
            }
        }
        grouped[deptName].staff.push({
            id: shift.id,
            name: shift.doctor.name,
            tier: shift.tier.name,
            phone: (shift.doctor as any).phone, // This will be undefined as 'phone' doesn't exist on Doctor
            actualPhone: shift.doctor.gsmCccrc || shift.doctor.gsmPersonal
        })
    }

    const firstDept = Object.values(grouped)[0]
    console.log('First Dept:', JSON.stringify(firstDept, null, 2))
}

check()
