'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Raw data from extraction (Step 1789)
const rawData = [
    { name: 'Adnan Saad Muhaimid Al Aali', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alaali18@gmail.com', gsmCccrc: '' },
    { name: 'Adam Latif Ahmad Abdaal', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.adamlatif@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Adhra Salim Al Hadrami', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.adhra@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Ahmad Issa Said Al Mahrouqi', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.almahrouqi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Ahmed Mohsin Al Kalbani', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alkalbani@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Ahmed Rashid Al-Harrasi', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alharrasi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Ahmed Salim Khamis Al Shueili', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alshueili@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Dr Zafar Rashid Kahn Khn Al Raid', department: 'Medical Specialists', specialty: 'Cardiology', extension: '4076', mixedContact: '92329379', gsmCccrc: '' },
    { name: 'Ahmad Mohammed Saleh Al Gmal', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.algmal@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Amal Fadhil Mohammed Ali Alder', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alderi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Dr Amal Ahmed Hamed Al Nasri', department: 'Medical Care', specialty: 'Palliative', extension: '', mixedContact: 'a.alnasri@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Ali Naji Ameer Dual Aziz Al Kiyat', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '99468489', gsmCccrc: '' },
    { name: 'Ahmed Yousif Hassan Al Balushi', department: 'Radiology', specialty: 'General', extension: '', mixedContact: 'a.albalushi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Aniqa Lina Rashid Al Ghasali', department: 'Radiology', specialty: 'General', extension: '', mixedContact: 'a.ghasali@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Amani Ali', department: 'Laboratory', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Amna Saber Ali Moussa', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.moussa@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Amna Ali Salim Al Nassr', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.alnassr@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Amna Khamis Rashid Al Rasbi', department: 'Medical Oncology', specialty: 'General', extension: '7022114', mixedContact: '', gsmCccrc: '' },
    { name: 'Amna Sulaih Marhia Al Mohammed', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'a.almuhammed@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Badria Salim Saleem Al Qasabi', department: 'Oncology Specialists', specialty: 'Breast Disease', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Bashar Sulaiman Al Ibrahim', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Buti Wali Alai Mohamed Ali Malik', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: 'b.malik@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Bilal', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Faisal Mohammad Al Badi', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Salama Day Valad', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Farhan Abdullah Al Khaldi', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Fatma Abdullah Sulaiman Al Ghaili', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: 'f.alghaili@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Fatma Mohammed Ali Al Shukaili', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: 'f.alshukaili@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Fatma Saud Al Amin', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: 'f.alamin@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Dr Foy Hail Saleh Al Haris', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: 'f.alharis@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Dr Prathibha Chandra', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Hadia Eissa Hamza Al Rubaiey', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'h.alrubaiey@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Osma Ali Hamad Al Sulaiti', department: 'Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Hilal Ali Hamad Al Rashdi', department: 'Urology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Huda Ahmad Issa Al Faraji', department: 'Medical Oncology', specialty: 'General', extension: '4070', mixedContact: '', gsmCccrc: '' },
    { name: 'Hanan Al Hassan', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Huda Ali Khalfan Al Rashdi', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'h.alrashdi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Jannat Abbas Mohammad Al Kaddi', department: 'Gastroenterology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Akhair Farhan', department: 'Gastroenterology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Jadeed Ellyas', department: 'Anesthesia', specialty: 'General', extension: '', mixedContact: 'j.ellyas@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Joseph Mary', department: 'Anesthesia', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Janahi', department: 'Anesthesia', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Catherine Thomo Kirimi', department: 'Oncology', specialty: 'Gynaecology', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Abid Jia Sabit Zikrla', department: 'Oncology', specialty: 'Gynaecology', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Jeery Muneer Nasser Al Baloushi', department: 'Dental Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Khalid Thuha Marli', department: 'Dental Surgery', specialty: 'General', extension: '4253', mixedContact: '', gsmCccrc: '' },
    { name: 'Hussain h. Al Lawati', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Khalid Pervez Lone', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Endi Winona Chacraretta', department: 'Radiology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Dr Ms Marwa Omer Abdul Khadir Al Male', department: 'Plastic Surgery', specialty: 'General', extension: '', mixedContact: 'a.almale@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Muhaisn Taslih Mansik', department: 'Plastic Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Muhamed Haji Alsajkhanee,Azadm', department: 'Dental Surgery', specialty: 'General', extension: '', mixedContact: 'a.alsajkhanee@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Nadia Bakker Roos', department: 'Medical Specialists', specialty: 'Rheumatology', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Noora Masila Rashid Al Musani', department: 'Cardiology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Maaz Al Jifri Eali Akhu', department: 'Pharmacy', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Mafar Ahmad Mahalluddeen Ebra', department: 'Pharmacy', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Mufaddal Ismail Ali Arif Ali Bhai', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'm.alibhai@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Muna Al Hashmi', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'm.alhashmi@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Muna Ali Saleem Al Amri', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 'm.alamri@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Mohamed Faizi', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Muthla Said', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Maryam Hamdan al Junaibi al Hashli', department: 'Medical Imaging', specialty: 'General', extension: '', mixedContact: 'm.alhashli@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Hafidha Said Sulaiman Al Sufi', department: 'Haematology', specialty: 'General', extension: '4068', mixedContact: '', gsmCccrc: '' },
    { name: 'Noor Saeed Khamis Radha', department: 'Laboratory', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Nasar Habetallah', department: 'Laboratory', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Koul Abd Waheed Al Subhi', department: 'Hepatology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Dr Mohamed Yowla Huda Al Jadid', department: 'Medical Specialists', specialty: 'Neurology', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Dr Ragavan Karthik', department: 'Anaesthesia', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Reem Ahmad Said Al Mukhar', department: 'Pulmonology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Dr. Sadanvitha Vasquez', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Feim Lard Zarl Al Shahmi', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Ramannan', department: 'Medical Care', specialty: 'General', extension: '', mixedContact: 'r.ramannan@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Sheika Amina Khalid Al Masri', department: 'Radiology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Laila Khan', department: 'Endocrine Care', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Laila Balushi', department: 'Cardiac Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Lorish Bhadani', department: 'Cardiac Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Tatian Ali Mazin Shamsi Dream', department: 'Radiology', specialty: 'General', extension: '', mixedContact: 'l.dream@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Lubab Eekram', department: 'ENT', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Lubab Amesh', department: 'Laboratory', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Amir Ghalib Mahmud Dream', department: 'Radiology', specialty: 'General', extension: '', mixedContact: 'a.dream@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Tamali Ali Muhammed Ali', department: 'Medical Oncology', specialty: 'General', extension: '', mixedContact: 't.ali@cccrc.gov.om', gsmCccrc: '' },
    { name: 'Hamid Shamsheer Pareel Mubbashar Pareel', department: 'Cardiology', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Zakya Abdullah Hamood Alkhabla', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
    { name: 'Zakia Abdullah Hamood Al Khabla', department: 'General Surgery', specialty: 'General', extension: '', mixedContact: '', gsmCccrc: '' },
]

async function importStaff() {
    console.log('Starting staff import...')
    console.log('Processing split for email and phone numbers...')

    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const staff of rawData) {
        try {
            // Process mixed contact field
            let email = null
            let gsmPersonal = null

            if (staff.mixedContact) {
                if (staff.mixedContact.includes('@')) {
                    email = staff.mixedContact
                } else {
                    gsmPersonal = staff.mixedContact
                }
            }

            // Find or skip if department doesn't exist
            let department = await prisma.department.findFirst({
                where: {
                    OR: [
                        { name: { contains: staff.department } },
                        { name: staff.department }
                    ]
                }
            })

            if (!department) {
                // Create department if it doesn't exist
                const code = staff.department.toUpperCase().replace(/\s+/g, '').slice(0, 8)
                department = await prisma.department.create({
                    data: {
                        name: staff.department,
                        code: code + Math.floor(Math.random() * 100),
                        isClinical: true,
                        isActive: true
                    }
                })
                console.log(`Created department: ${staff.department}`)
            }

            // Check if staff already exists
            const existingDoctor = await prisma.doctor.findFirst({
                where: { name: staff.name }
            })

            if (existingDoctor) {
                console.log(`Skipped (exists): ${staff.name}`)
                skippedCount++
                continue
            }

            // Find specialty if applicable
            let specialtyId = null
            if (staff.specialty && staff.specialty !== 'General') {
                const specialty = await prisma.specialty.findFirst({
                    where: {
                        name: staff.specialty,
                        departmentId: department.id
                    }
                })
                if (specialty) {
                    specialtyId = specialty.id
                }
            }

            // Create the staff member
            await prisma.doctor.create({
                data: {
                    name: staff.name,
                    email: email,
                    extension: staff.extension || null,
                    gsmPersonal: gsmPersonal || null,
                    gsmCccrc: staff.gsmCccrc || null,
                    departmentId: department.id,
                    specialtyId: specialtyId,
                    isActive: true
                }
            })

            console.log(`Imported: ${staff.name} -> ${staff.department} (Email: ${email || 'none'})`)
            importedCount++
        } catch (error) {
            console.error(`Error importing ${staff.name}:`, error)
            errorCount++
        }
    }

    console.log('\n--- Import Summary ---')
    console.log(`Imported: ${importedCount}`)
    console.log(`Skipped: ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total: ${rawData.length}`)
}

importStaff()
    .then(() => {
        console.log('Import completed!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Import failed:', error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
