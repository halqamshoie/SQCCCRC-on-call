import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Path to the data file
const DATA_FILE_PATH = '/Users/hindalqmahouai/Downloads/staff_data.js'

async function addMultipleStaff() {
    console.log(`Reading staff data from ${DATA_FILE_PATH}...`)

    let staffList: any[] = []

    try {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8')
        // Evaluate the file content to get the data
        // We strip 'const staffData =' and any trailing semicolons to get just the array expression if needed
        // Or simply eval the whole thing and access staffData if it were global, but eval context is tricky.
        // Easiest is to replace 'const staffData =' with '' and eval the expression.
        const cleanContent = fileContent.replace('const staffData =', '').replace(/;\s*$/, '')
        // Use Function constructor to evaluate safe-ish
        staffList = eval(cleanContent)

        if (!Array.isArray(staffList)) {
            throw new Error('Parsed data is not an array')
        }
    } catch (e) {
        console.error('Failed to read or parse staff data:', e)
        process.exit(1)
    }

    console.log(`Found ${staffList.length} staff members. Starting import...`)

    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const staff of staffList) {
        try {
            // Validate required fields
            if (!staff.name || !staff.departmentName) {
                console.warn(`Skipping invalid entry: ${JSON.stringify(staff).slice(0, 50)}...`)
                continue
            }

            // 1. Find or Create Department
            let department = await prisma.department.findFirst({
                where: { name: staff.departmentName }
            })

            if (!department) {
                // Ensure unique code
                const codeBase = staff.departmentName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'DEPT'
                const code = codeBase + Math.floor(Math.random() * 10000)

                department = await prisma.department.create({
                    data: {
                        name: staff.departmentName,
                        code: code,
                        isClinical: true,
                        isActive: true
                    }
                })
                console.log(`Created Department: ${staff.departmentName}`)
            }

            // 2. Check if staff already exists by name
            const existing = await prisma.doctor.findFirst({
                where: { name: staff.name }
            })

            if (existing) {
                // console.log(`Skipping ${staff.name} - already exists.`)
                skippedCount++
                continue
            }

            // 3. Find or Create Specialty (Optional)
            let specialtyId = null
            if (staff.specialtyName && staff.specialtyName !== 'General' && staff.specialtyName.trim() !== '') {
                let specialty = await prisma.specialty.findFirst({
                    where: {
                        name: staff.specialtyName,
                        departmentId: department.id
                    }
                })

                if (!specialty) {
                    // Create the specialty for this department
                    specialty = await prisma.specialty.create({
                        data: {
                            name: staff.specialtyName,
                            departmentId: department.id,
                            isActive: true
                        }
                    })
                    console.log(`Created Specialty: ${staff.specialtyName} in ${staff.departmentName}`)
                }

                specialtyId = specialty.id
            }

            // 4. Create Staff Member
            // Clean up empty strings to null or leave as string? Database schema allows headers? No, schema says String?
            // "gsmPersonal": "" -> should be saved as "" or null?
            // Better to keep as is, or check schema constraints.
            // If uniqueness is required on email, we might have issues if email is empty string.
            // But email is optional in schema?
            // Let's check schema for uniqueness constraints.

            await prisma.doctor.create({
                data: {
                    name: staff.name,
                    email: staff.email || null, // Convert empty string to null if needed
                    departmentId: department.id,
                    specialtyId: specialtyId,
                    gsmPersonal: staff.gsmPersonal || null,
                    gsmCccrc: staff.gsmCccrc || null,
                    extension: staff.extension || null,
                    isActive: true
                }
            })
            // console.log(`Added: ${staff.name}`)
            addedCount++

            // Log progress every 10 items
            if ((addedCount + skippedCount) % 10 === 0) {
                process.stdout.write('.')
            }

        } catch (error) {
            console.error(`\nError adding ${staff.name}:`, error)
            errorCount++
        }
    }

    console.log('\n\n--- Bulk Import Summary ---')
    console.log(`Added: ${addedCount}`)
    console.log(`Skipped (Exists): ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total Processed: ${staffList.length}`)
}

addMultipleStaff()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Script failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
