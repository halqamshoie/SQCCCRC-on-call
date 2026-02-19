import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clear existing data (in correct order to respect foreign keys)
    await prisma.escalationLog.deleteMany()
    await prisma.shift.deleteMany()
    await prisma.doctor.deleteMany()
    await prisma.onCallTier.deleteMany()
    await prisma.specialty.deleteMany()
    await prisma.department.deleteMany()

    console.log('✅ Cleared existing data')

    // Clinical Departments
    const departmentsData = [
        { name: 'Anesthesia', code: 'ANES', color: '#607D8B', isClinical: true, specialties: ['Anesthesia'] },
        { name: 'Holistic Care', code: 'HC', color: '#8D6E63', isClinical: true, specialties: ['Palliative', 'Physiotherapy', 'Psychosocial Unit'] },
        { name: 'ICU', code: 'ICU', color: '#D32F2F', isClinical: true, specialties: ['ICU'] },
        { name: 'Laboratory', code: 'LAB', color: '#7B1FA2', isClinical: true, specialties: ['Molecular Pathology', 'Biochemistry', 'Hematology & Blood Bank', 'Histopathology', 'Microbiology'] },
        { name: 'Medical Oncology', code: 'ONCO', color: '#C2185B', isClinical: true, specialties: ['Medical Oncology'] },
        { name: 'Medical Specialties', code: 'MED', color: '#1976D2', isClinical: true, specialties: ['Cardiology', 'Endocrinology', 'Gastroenterology', 'Infectious Disease', 'Nephrology', 'Neurology', 'Pulmonology'] },
        { name: 'Nursing', code: 'NURS', color: '#E91E63', isClinical: true, specialties: ['Nursing'] },
        { name: 'Nutrition & Dietetics', code: 'NUT', color: '#AFB42B', isClinical: true, specialties: ['Nutrition'] },
        { name: 'Pharmacy', code: 'PHAR', color: '#00796B', isClinical: true, specialties: ['Pharmacy'] },
        { name: 'Radiology', code: 'RAD', color: '#388E3C', isClinical: true, specialties: ['Radiology'] },
        { name: 'Radiotherapy', code: 'RTH', color: '#FBC02D', isClinical: true, specialties: ['Radiotherapy'] },
        { name: 'RT', code: 'RT', color: '#F57C00', isClinical: true, specialties: ['RT'] },
        { name: 'Surgery', code: 'SURG', color: '#0288D1', isClinical: true, specialties: ['General Surgery', 'Urology', 'Gynecology', 'E.N.T'] },

        // Non-Clinical Departments
        { name: 'Administration', code: 'ADMIN', color: '#546E7A', isClinical: false, specialties: [] },
        { name: 'Safety & Environment', code: 'SAFE', color: '#78909C', isClinical: false, specialties: [] },
        { name: 'Kitchen', code: 'KITCH', color: '#8D6E63', isClinical: false, specialties: [] },
        { name: 'Maintenance', code: 'MAINT', color: '#6D4C41', isClinical: false, specialties: [] },
        { name: 'PR', code: 'PR', color: '#AB47BC', isClinical: false, specialties: [] },
        { name: 'Security', code: 'SEC', color: '#424242', isClinical: false, specialties: [] },
        { name: 'Housekeeping', code: 'HOUSE', color: '#26A69A', isClinical: false, specialties: [] },
        { name: 'Call Center', code: 'CALL', color: '#29B6F6', isClinical: false, specialties: [] },
        { name: 'Patient Flow Office', code: 'PFO', color: '#5C6BC0', isClinical: false, specialties: [] },
        { name: 'Patient Experience Team', code: 'PET', color: '#EC407A', isClinical: false, specialties: [] },
        { name: 'Infection Prevention & Control - IPC Team', code: 'IPC', color: '#EF5350', isClinical: false, specialties: [] },
        { name: 'Biomedical Engineering', code: 'BIOM', color: '#7E57C2', isClinical: false, specialties: [] },
        { name: 'DG Office', code: 'DG', color: '#455A64', isClinical: false, specialties: [] },
        { name: 'Informatics & Cyber Security Department', code: 'ICS', color: '#00ACC1', isClinical: false, specialties: ['Help Desk', 'Cyber Security', 'HIS Access, Active Directory and Email', 'LIS', 'HIS & EMR', 'Infrastructure (Servers & Network)'] },
    ]

    const createdDeps: Record<string, any> = {}
    const createdSpecs: Record<string, any> = {}

    // Create Departments and Specialties
    for (const dep of departmentsData) {
        const d = await prisma.department.create({
            data: {
                name: dep.name,
                code: dep.code,
                color: dep.color,
                isClinical: dep.isClinical,
            }
        })
        createdDeps[d.name] = d

        for (const specName of dep.specialties) {
            const s = await prisma.specialty.create({
                data: {
                    name: specName,
                    departmentId: d.id,
                    description: `${specName} service`
                }
            })
            createdSpecs[specName] = s

            // Create Standard Tiers for each Specialty
            // Using a standard 1st/2nd/Consultant tier structure for now
            const tiers = [
                { name: '1st Call', level: 1, response: 15 },
                { name: '2nd Call', level: 2, response: 30 },
                { name: 'Consultant', level: 3, response: 60 }
            ]

            let previousTierId = null
            for (const t of tiers) {
                const tier = await prisma.onCallTier.create({
                    data: {
                        name: t.name,
                        level: t.level,
                        displayOrder: t.level,
                        responseTimeMinutes: t.response,
                        specialtyId: s.id,
                    }
                })

                if (previousTierId) {
                    await prisma.onCallTier.update({
                        where: { id: previousTierId },
                        data: { escalationTierId: tier.id }
                    })
                }
                previousTierId = tier.id
            }
        }
    }

    console.log('✅ Created departments, specialties, and tiers')

    // Helper to create doctor
    const createDoctor = async (name: string, deptName: string, specName: string, title = 'Specialist') => {
        const dept = createdDeps[deptName]
        const spec = createdSpecs[specName]
        if (!dept || !spec) return null

        // Get default tier (1st call)
        const tier = await prisma.onCallTier.findFirst({
            where: { specialtyId: spec.id, level: 1 }
        })

        return await prisma.doctor.create({
            data: {
                name,
                extension: '1234',
                gsmPersonal: '+968 9000 0000',
                jobTitle: title,
                departmentId: dept.id,
                specialtyId: spec.id,
                defaultTierId: tier?.id,
            }
        })
    }

    // Create some sample doctors and shifts to populate the dashboard
    const doctors = []

    // Medical Oncology
    doctors.push(await createDoctor('Dr. Ali Al-Onco', 'Medical Oncology', 'Medical Oncology', 'Consultant'))

    // Cardiology
    doctors.push(await createDoctor('Dr. Sarah Cardio', 'Medical Specialties', 'Cardiology', 'Specialist'))

    // Lab
    doctors.push(await createDoctor('Tech. John Lab', 'Laboratory', 'Hematology & Blood Bank', 'Senior Technologist'))

    // ICU
    doctors.push(await createDoctor('Dr. Icu Specialist', 'ICU', 'ICU', 'ICU Specialist'))

    // Surgery
    doctors.push(await createDoctor('Dr. Surgeon General', 'Surgery', 'General Surgery', 'Surgeon'))

    console.log('✅ Created sample doctors')

    // Create today's shifts
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const doc of doctors) {
        if (!doc) continue

        await prisma.shift.create({
            data: {
                doctorId: doc.id,
                specialtyId: doc.specialtyId,
                tierId: doc.defaultTierId!,
                date: today,
                startTime: '08:00',
                endTime: '20:00',
            }
        })
    }

    console.log('✅ Created today\'s shifts')

    // Seed emergency codes if they don't exist
    const existingCodes = await prisma.emergencyCode.findMany()
    if (existingCodes.length === 0) {
        await prisma.emergencyCode.createMany({
            data: [
                { code: 'SECURITY', extension: '1111', color: '#B8860B', description: 'Security Emergency' },
                { code: 'CODE ORANGE', extension: '2222', color: '#FF8C00', description: 'Mass Casualty/Disaster' },
                { code: 'FIRE', extension: '5555', color: '#DC2626', description: 'Fire Emergency' },
                { code: 'CODE WHITE', extension: '6666', color: '#94A3B8', description: 'Violent/Combative Person' },
                { code: 'CODE BLUE', extension: '7777', color: '#2563EB', description: 'Cardiac/Respiratory Arrest' },
                { code: 'RAPID RESPONSE', extension: '8888', color: '#16A34A', description: 'Medical Emergency Response' },
            ]
        })
        console.log('✅ Created emergency codes')
    }

    console.log('🎉 Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
