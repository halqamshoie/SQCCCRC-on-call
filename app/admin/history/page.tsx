import { getShiftHistory } from '@/lib/actions'
import { getDepartments } from '@/lib/department-actions'
import { requireAdminOrCoordinator } from '@/lib/rbac'
import { getCurrentUser } from '@/lib/auth'
import { ShiftHistoryClient } from '@/components/admin/ShiftHistoryClient'
import { History, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
    await requireAdminOrCoordinator()
    const user = await getCurrentUser()

    // Load last 7 days by default
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Coordinators only see their department
    const coordinatorDeptId = user?.role === 'COORDINATOR' ? user.departmentId : undefined

    const [shifts, allDepartments] = await Promise.all([
        getShiftHistory({
            startDate,
            endDate,
            departmentId: coordinatorDeptId || undefined
        }),
        getDepartments()
    ])

    // Filter departments list for coordinators
    const departments = coordinatorDeptId
        ? allDepartments.filter(d => d.id === coordinatorDeptId)
        : allDepartments

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <History className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Shift History</h2>
                {coordinatorDeptId && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center gap-1">
                        <AlertCircle size={14} />
                        Your Department Only
                    </span>
                )}
            </div>

            <ShiftHistoryClient
                initialShifts={shifts as any}
                departments={departments.map(d => ({ id: d.id, name: d.name }))}
                coordinatorDeptId={coordinatorDeptId || undefined}
            />
        </div>
    )
}
