import { getAllDoctors, getAllTiers } from '@/lib/admin-actions'
import { getDepartments } from '@/lib/department-actions'
import { requireAdminOrCoordinator } from '@/lib/rbac'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ShiftForm } from '@/components/admin/ShiftForm'
import { ShiftManagementList } from '@/components/admin/ShiftManagementList'
import { Calendar, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageShiftsPage() {
    const user = await requireAdminOrCoordinator()
    const currentUser = await getCurrentUser()

    // Coordinators only see their department
    const coordinatorDeptId = currentUser?.role === 'COORDINATOR' && currentUser.departmentId
        ? currentUser.departmentId
        : undefined

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch current and future shifts (including fixed shifts)
    const shifts = await prisma.shift.findMany({
        where: {
            OR: [
                // Future shifts
                { date: { gte: today } },
                // Date range that includes today or future
                { endDate: { gte: today } },
                // Fixed shifts (show always)
                { isFixed: true }
            ],
            ...(coordinatorDeptId && {
                doctor: { departmentId: coordinatorDeptId }
            })
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
            { date: 'asc' },
            { tier: { level: 'asc' } }
        ]
    })

    const doctors = await getAllDoctors(coordinatorDeptId)
    const tiers = await getAllTiers()
    const allDepartments = await getDepartments()

    // Filter departments for coordinators
    const departments = coordinatorDeptId
        ? allDepartments.filter(d => d.id === coordinatorDeptId)
        : allDepartments

    // Get department name for coordinator
    let departmentName = ''
    if (coordinatorDeptId) {
        const dept = allDepartments.find(d => d.id === coordinatorDeptId)
        departmentName = dept?.name || 'Your Department'
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Manage Shifts</h2>
                {coordinatorDeptId && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center gap-1">
                        <AlertCircle size={14} />
                        {departmentName}
                    </span>
                )}
            </div>

            <p className="text-slate-500 mb-8">
                {coordinatorDeptId
                    ? `Manage current and upcoming on-call shifts for ${departmentName}.`
                    : 'Manage current and upcoming on-call shifts for all departments.'
                }
            </p>

            {/* Add New Shift Form */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Add New Shift</h3>
                <ShiftForm
                    doctors={doctors}
                    tiers={tiers}
                    departments={departments.map(d => ({
                        id: d.id,
                        name: d.name,
                        isClinical: d.isClinical,
                        specialties: d.specialties.map(s => ({ id: s.id, name: s.name }))
                    }))}
                    currentUser={{
                        role: currentUser?.role || 'USER',
                        departmentId: currentUser?.departmentId
                    }}
                />
            </div>

            {/* Shifts List */}
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                    Current & Upcoming Shifts ({shifts.length})
                </h3>
                <ShiftManagementList
                    shifts={shifts.map(shift => ({
                        id: shift.id,
                        date: (shift.date as Date).toISOString(),
                        endDate: shift.endDate ? (shift.endDate as Date).toISOString() : null,
                        isFixed: shift.isFixed,
                        notes: shift.notes,
                        doctor: {
                            id: shift.doctor.id,
                            name: shift.doctor.name,
                            departmentId: shift.doctor.departmentId,
                            department: {
                                name: shift.doctor.department.name,
                                color: shift.doctor.department.color,
                                isClinical: shift.doctor.department.isClinical
                            }
                        },
                        tier: { id: shift.tier.id, name: shift.tier.name },
                        specialty: shift.specialty ? { name: shift.specialty.name } : null
                    }))}
                    doctors={doctors.map(d => ({
                        id: d.id,
                        name: d.name,
                        departmentId: d.departmentId,
                        specialty: d.specialty
                    }))}
                    tiers={tiers.map(t => ({ id: t.id, name: t.name, specialtyId: t.specialtyId }))}
                />
            </div>
        </div>
    )
}
