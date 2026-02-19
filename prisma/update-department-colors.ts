import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Unique, visually distinct colors for each department
const DEPARTMENT_COLORS: Record<string, string> = {
    // Clinical departments - warm colors
    'Surgery': '#DC2626',           // Red
    'Medical oncology': '#EA580C',  // Orange
    'Medical Specialties': '#D97706', // Amber
    'ICU': '#B91C1C',               // Dark red
    'Anesthesia': '#9333EA',        // Purple

    // Support departments - cool colors
    'Radiology': '#2563EB',         // Blue
    'RT': '#0891B2',                // Cyan
    'Radiotherapy': '#0D9488',      // Teal

    // Care departments - green shades
    'Holistic Care': '#059669',     // Emerald
    'Nursing': '#16A34A',           // Green

    // Other departments
    'Pharmacy': '#7C3AED',          // Violet
    'Nutrition & Dietetics': '#CA8A04', // Yellow-600
}

async function updateDepartmentColors() {
    console.log('Updating department colors...\n')

    const departments = await prisma.department.findMany()

    for (const dept of departments) {
        const newColor = DEPARTMENT_COLORS[dept.name]

        if (newColor && dept.color !== newColor) {
            await prisma.department.update({
                where: { id: dept.id },
                data: { color: newColor }
            })
            console.log(`✓ ${dept.name}: ${dept.color} → ${newColor}`)
        } else if (!newColor) {
            // Generate a fallback color for unknown departments
            const hue = (dept.id * 137.508) % 360 // Golden angle for distribution
            const fallbackColor = `hsl(${Math.round(hue)}, 70%, 45%)`
            console.log(`? ${dept.name}: No predefined color, using ${fallbackColor}`)
        } else {
            console.log(`- ${dept.name}: Already has correct color`)
        }
    }

    console.log('\n✓ Department colors updated!')
}

updateDepartmentColors()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Error updating colors:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
