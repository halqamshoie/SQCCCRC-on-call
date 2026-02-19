import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Each entry: department name, optional section (specialty), and contacts
interface ContactEntry {
    department: string
    section: string | null
    extension: string | null
    gsmCccrc: string | null
    gsmPersonal: string | null
}

// Parse the raw data
const entries: ContactEntry[] = [
    { department: 'DG Office', section: null, extension: null, gsmCccrc: '99349703', gsmPersonal: null },
    { department: 'Kitchen', section: null, extension: '4865, 4867', gsmCccrc: null, gsmPersonal: null },
    { department: 'Maintenance', section: null, extension: null, gsmCccrc: '4999', gsmPersonal: null },
    { department: 'PR', section: null, extension: '4079, 4077', gsmCccrc: null, gsmPersonal: null },
    { department: 'Security', section: null, extension: null, gsmCccrc: '72723019', gsmPersonal: null },
    { department: 'Housekeeping', section: null, extension: null, gsmCccrc: '98531761', gsmPersonal: null },
    { department: 'Call Center', section: null, extension: '4001, 4002', gsmCccrc: null, gsmPersonal: null },
    { department: 'Patient Flow Office', section: null, extension: null, gsmCccrc: '4080', gsmPersonal: null },
    { department: 'Patient Experience Team', section: null, extension: '4082, 4085', gsmCccrc: '72723044', gsmPersonal: null },
    { department: 'Infection Prevention & Control', section: 'IPC Team', extension: null, gsmCccrc: '4418, 72723087', gsmPersonal: null },
    { department: 'Administration', section: null, extension: null, gsmCccrc: '4088, 72723025, 99349703', gsmPersonal: null },
    { department: 'Biomedical Engineering', section: null, extension: null, gsmCccrc: '3331, 98663672', gsmPersonal: '98355556' },
    { department: 'Safety & Environment', section: null, extension: '4335, 4796', gsmCccrc: '72533376', gsmPersonal: null },
    { department: 'Admission Office', section: null, extension: null, gsmCccrc: '72727353', gsmPersonal: null },
    { department: 'Biomedical Engineering', section: 'Alternate', extension: null, gsmCccrc: '96682203', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'Cyber Security', extension: null, gsmCccrc: '72727335', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'HIS Access, AD and Email', extension: '4350, 4338', gsmCccrc: '72727310', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'LIS', extension: null, gsmCccrc: '72727311', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'HIS & EMR', extension: '4356, 4355, 4354, 4353', gsmCccrc: '72727302', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'Help Desk', extension: null, gsmCccrc: '4443, 72533370', gsmPersonal: null },
    { department: 'Informatics & Cyber Security', section: 'Infrastructure - Servers & Network', extension: null, gsmCccrc: '72723077', gsmPersonal: null },
]

// Generate a short department code from name
function generateCode(name: string): string {
    // Take first letter of each word, max 6 chars
    const words = name.split(/[\s&-]+/).filter(w => w.length > 0)
    let code = words.map(w => w[0].toUpperCase()).join('')
    if (code.length < 2) code = name.substring(0, 3).toUpperCase()
    return code
}

async function addFixedShifts() {
    console.log('Adding support department fixed shifts...\n')

    let created = 0
    let skipped = 0

    for (const entry of entries) {
        const staffName = entry.section
            ? `${entry.department} - ${entry.section}`
            : entry.department

        console.log(`\nProcessing: ${staffName}`)

        // 1. Create or find department
        let dept = await prisma.department.findFirst({
            where: { name: entry.department }
        })

        if (!dept) {
            const code = generateCode(entry.department)
            // Check for code collision
            const existingCode = await prisma.department.findUnique({ where: { code } })
            const finalCode = existingCode ? code + Math.floor(Math.random() * 100) : code

            dept = await prisma.department.create({
                data: {
                    name: entry.department,
                    code: finalCode,
                    isClinical: false,
                    isActive: true,
                    color: '#6B7280' // Gray default
                }
            })
            console.log(`  ✓ Created department: ${entry.department} (${finalCode})`)
        } else {
            console.log(`  ◦ Department exists: ${entry.department}`)
        }

        // 2. Create or find specialty (section)
        let specialty = null
        if (entry.section) {
            specialty = await prisma.specialty.findFirst({
                where: {
                    name: entry.section,
                    departmentId: dept.id
                }
            })

            if (!specialty) {
                specialty = await prisma.specialty.create({
                    data: {
                        name: entry.section,
                        departmentId: dept.id,
                        isActive: true
                    }
                })
                console.log(`  ✓ Created specialty: ${entry.section}`)
            } else {
                console.log(`  ◦ Specialty exists: ${entry.section}`)
            }
        }

        // 3. Create or find "On-call Staff" tier for the specialty/department
        const tierSpecialtyId = specialty?.id
        let tier = null

        if (tierSpecialtyId) {
            tier = await prisma.onCallTier.findFirst({
                where: {
                    name: 'On-call Staff',
                    specialtyId: tierSpecialtyId
                }
            })

            if (!tier) {
                tier = await prisma.onCallTier.create({
                    data: {
                        name: 'On-call Staff',
                        level: 1,
                        displayOrder: 1,
                        specialtyId: tierSpecialtyId
                    }
                })
                console.log(`  ✓ Created tier: On-call Staff`)
            }
        } else {
            // No specialty - create a "General" specialty first for the tier
            let generalSpec = await prisma.specialty.findFirst({
                where: { name: 'General', departmentId: dept.id }
            })

            if (!generalSpec) {
                generalSpec = await prisma.specialty.create({
                    data: {
                        name: 'General',
                        departmentId: dept.id,
                        isActive: true
                    }
                })
            }

            tier = await prisma.onCallTier.findFirst({
                where: {
                    name: 'On-call Staff',
                    specialtyId: generalSpec.id
                }
            })

            if (!tier) {
                tier = await prisma.onCallTier.create({
                    data: {
                        name: 'On-call Staff',
                        level: 1,
                        displayOrder: 1,
                        specialtyId: generalSpec.id
                    }
                })
                console.log(`  ✓ Created tier: On-call Staff (General)`)
            }

            // Use general specialty for the shift
            specialty = generalSpec
        }

        // 4. Create doctor/staff entry
        let doctor = await prisma.doctor.findFirst({
            where: { name: staffName, departmentId: dept.id }
        })

        if (!doctor) {
            doctor = await prisma.doctor.create({
                data: {
                    name: staffName,
                    departmentId: dept.id,
                    specialtyId: specialty?.id || null,
                    extension: entry.extension || null,
                    gsmCccrc: entry.gsmCccrc || null,
                    gsmPersonal: entry.gsmPersonal || null,
                    isActive: true
                }
            })
            console.log(`  ✓ Created staff: ${staffName}`)
        } else {
            console.log(`  ◦ Staff exists: ${staffName}`)
        }

        // 5. Create fixed shift
        const existingShift = await prisma.shift.findFirst({
            where: {
                doctorId: doctor.id,
                isFixed: true,
                tierId: tier.id
            }
        })

        if (!existingShift) {
            await prisma.shift.create({
                data: {
                    date: new Date(),
                    isFixed: true,
                    doctorId: doctor.id,
                    tierId: tier.id,
                    specialtyId: specialty?.id || null
                }
            })
            console.log(`  ✓ Created fixed shift`)
            created++
        } else {
            console.log(`  ◦ Fixed shift already exists`)
            skipped++
        }
    }

    console.log('\n========== SUMMARY ==========')
    console.log(`✓ Fixed shifts created: ${created}`)
    console.log(`◦ Skipped (already exist): ${skipped}`)
    console.log(`Total entries: ${entries.length}`)

    await prisma.$disconnect()
}

addFixedShifts().catch(console.error)
