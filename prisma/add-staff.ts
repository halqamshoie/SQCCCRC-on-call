import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------
// EDIT THIS SECTION WITH THE NEW STAFF DETAILS
// ---------------------------------------------------------
const newStaff = {
    name: "Dr. New Staff Member",
    email: "new.staff@cccrc.gov.om",
    departmentName: "Medical Oncology", // Must match an existing department or it will be created
    specialtyName: "General",           // Optional
    gsmPersonal: "99999999",
    gsmCccrc: "77777777",
    extension: "1234"
}
// ---------------------------------------------------------

async function addStaff() {
    console.log(`Adding staff: ${newStaff.name}...`)

    // 1. Find or Create Department
    let department = await prisma.department.findFirst({
        where: { name: newStaff.departmentName }
    })

    if (!department) {
        console.log(`Department '${newStaff.departmentName}' not found. Creating it...`)
        const code = newStaff.departmentName.toUpperCase().replace(/\s+/g, '').slice(0, 4)
        department = await prisma.department.create({
            data: {
                name: newStaff.departmentName,
                code: code + Math.floor(Math.random() * 1000), // Random code to avoid conflicts
                isClinical: true,
                isActive: true
            }
        })
    }

    // 2. Find Specialty (Optional)
    let specialtyId = null
    if (newStaff.specialtyName && newStaff.specialtyName !== 'General') {
        const specialty = await prisma.specialty.findFirst({
            where: {
                name: newStaff.specialtyName,
                departmentId: department.id
            }
        })
        if (specialty) {
            specialtyId = specialty.id
        }
    }

    // 3. Create Staff Member
    const doctor = await prisma.doctor.create({
        data: {
            name: newStaff.name,
            email: newStaff.email,
            departmentId: department.id,
            specialtyId: specialtyId,
            gsmPersonal: newStaff.gsmPersonal,
            gsmCccrc: newStaff.gsmCccrc,
            extension: newStaff.extension,
            isActive: true
        }
    })

    console.log('Successfully added staff member:')
    console.log(doctor)
}

addStaff()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Error adding staff:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
