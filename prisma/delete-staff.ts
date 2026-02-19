import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const staffNames = [
    'Adnan Saad Muhaimid Al Aali', 'Adam Latif Ahmad Abdaal', 'Adhra Salim Al Hadrami',
    'Ahmad Issa Said Al Mahrouqi', 'Ahmed Mohsin Al Kalbani', 'Ahmed Rashid Al-Harrasi',
    'Ahmed Salim Khamis Al Shueili', 'Dr Zafar Rashid Kahn Khn Al Raid',
    'Ahmad Mohammed Saleh Al Gmal', 'Amal Fadhil Mohammed Ali Alder',
    'Dr Amal Ahmed Hamed Al Nasri', 'Ali Naji Ameer Dual Aziz Al Kiyat',
    'Ahmed Yousif Hassan Al Balushi', 'Aniqa Lina Rashid Al Ghasali', 'Amani Ali',
    'Amna Saber Ali Moussa', 'Amna Ali Salim Al Nassr', 'Amna Khamis Rashid Al Rasbi',
    'Amna Sulaih Marhia Al Mohammed', 'Badria Salim Saleem Al Qasabi',
    'Bashar Sulaiman Al Ibrahim', 'Buti Wali Alai Mohamed Ali Malik', 'Bilal',
    'Faisal Mohammad Al Badi', 'Salama Day Valad', 'Farhan Abdullah Al Khaldi',
    'Fatma Abdullah Sulaiman Al Ghaili', 'Fatma Mohammed Ali Al Shukaili',
    'Fatma Saud Al Amin', 'Dr Foy Hail Saleh Al Haris', 'Dr Prathibha Chandra',
    'Hadia Eissa Hamza Al Rubaiey', 'Osma Ali Hamad Al Sulaiti', 'Hilal Ali Hamad Al Rashdi',
    'Huda Ahmad Issa Al Faraji', 'Hanan Al Hassan', 'Huda Ali Khalfan Al Rashdi',
    'Jannat Abbas Mohammad Al Kaddi', 'Akhair Farhan', 'Jadeed Ellyas', 'Joseph Mary',
    'Janahi', 'Catherine Thomo Kirimi', 'Abid Jia Sabit Zikrla',
    'Jeery Muneer Nasser Al Baloushi', 'Khalid Thuha Marli', 'Hussain h. Al Lawati',
    'Khalid Pervez Lone', 'Endi Winona Chacraretta', 'Dr Ms Marwa Omer Abdul Khadir Al Male',
    'Muhaisn Taslih Mansik', 'Muhamed Haji Alsajkhanee,Azadm', 'Nadia Bakker Roos',
    'Noora Masila Rashid Al Musani', 'Maaz Al Jifri Eali Akhu', 'Mafar Ahmad Mahalluddeen Ebra',
    'Mufaddal Ismail Ali Arif Ali Bhai', 'Muna Al Hashmi', 'Muna Ali Saleem Al Amri',
    'Mohamed Faizi', 'Muthla Said', 'Maryam Hamdan al Junaibi al Hashli',
    'Hafidha Said Sulaiman Al Sufi', 'Noor Saeed Khamis Radha', 'Nasar Habetallah',
    'Koul Abd Waheed Al Subhi', 'Dr Mohamed Yowla Huda Al Jadid', 'Dr Ragavan Karthik',
    'Reem Ahmad Said Al Mukhar', 'Dr. Sadanvitha Vasquez', 'Feim Lard Zarl Al Shahmi',
    'Ramannan', 'Sheika Amina Khalid Al Masri', 'Laila Khan', 'Laila Balushi',
    'Lorish Bhadani', 'Tatian Ali Mazin Shamsi Dream', 'Lubab Eekram', 'Lubab Amesh',
    'Amir Ghalib Mahmud Dream', 'Tamali Ali Muhammed Ali', 'Hamid Shamsheer Pareel Mubbashar Pareel',
    'Zakya Abdullah Hamood Alkhabla', 'Zakia Abdullah Hamood Al Khabla'
]

async function deleteStaff() {
    console.log(`Deleting up to ${staffNames.length} staff members...`)
    const result = await prisma.doctor.deleteMany({
        where: { name: { in: staffNames } }
    })
    console.log(`Successfully deleted ${result.count} staff members.`)
}

deleteStaff()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
