import { OnCallCard } from "./OnCallCard"

interface DepartmentSectionProps {
    department: any
    specialties: any
}

// Tier display order priority (lower = displayed first)
const TIER_ORDER: Record<string, number> = {
    "1st call": 1,
    "1st on call": 1,
    "2nd call": 2,
    "2nd on call": 2,
    "3rd call": 3,
    "3rd on call": 3,
    "consultant": 4,
    "3rd on call / consultant": 4,
    "technologist": 5,
    "senior technologist": 6,
    "supervisor": 7,
}

function getTierPriority(tierName: string): number {
    const lower = tierName.toLowerCase()
    // Check for exact matches first
    if (TIER_ORDER[lower] !== undefined) return TIER_ORDER[lower]
    // Fuzzy match
    if (lower.includes("1st")) return 1
    if (lower.includes("2nd")) return 2
    if (lower.includes("3rd") || lower.includes("consultant")) return 3
    if (lower === "technologist") return 5
    if (lower.includes("senior tech")) return 6
    if (lower.includes("supervisor")) return 7
    return 99 // Unknown tiers at end
}

export function DepartmentSection({ department, specialties }: DepartmentSectionProps) {
    const departmentColor = department.color || '#3B82F6'
    const specialtyEntries = Object.values(specialties) as any[]

    if (specialtyEntries.length === 0) return null

    // Collect all shifts across specialties for this department
    // and sort them by tier priority
    const allShifts: any[] = []
    specialtyEntries.forEach((specialtyData: any) => {
        const specialty = specialtyData.specialty
        const shifts = specialtyData.shifts
        shifts.forEach((shift: any) => {
            allShifts.push({
                ...shift,
                specialtyName: specialty?.name || 'General'
            })
        })
    })

    // Sort shifts by tier priority
    allShifts.sort((a, b) => {
        const priorityA = getTierPriority(a.tier?.name || '')
        const priorityB = getTierPriority(b.tier?.name || '')
        return priorityA - priorityB
    })

    if (allShifts.length === 0) return null

    return (
        <div className="mb-10">
            {/* Department Header */}
            <div
                className="mb-4 pb-2 border-b-2 flex items-center gap-3"
                style={{ borderColor: departmentColor }}
            >
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: departmentColor }}
                />
                <h2 className="text-2xl font-bold text-slate-800">
                    {department.name}
                </h2>
                <span className="text-sm text-slate-400 font-mono">
                    {department.code}
                </span>
            </div>

            {/* On-Call Cards - Grid Layout for Equal Heights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allShifts.map((shift: any) => (
                    <OnCallCard key={shift.id} shift={shift} />
                ))}
            </div>
        </div>
    )
}
