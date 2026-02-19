import { getShiftStatistics } from '@/lib/actions'
import { requireAdminOrCoordinator } from '@/lib/rbac'
import { getCurrentUser } from '@/lib/auth'
import { getDepartments } from '@/lib/department-actions'
import { BarChart3, Users, Building2, TrendingUp, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
    await requireAdminOrCoordinator()
    const user = await getCurrentUser()

    // Get stats for last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Coordinators only see their department
    const coordinatorDeptId = user?.role === 'COORDINATOR' ? user.departmentId : undefined

    // Get department name if coordinator
    let departmentName = ''
    if (coordinatorDeptId) {
        const departments = await getDepartments()
        const dept = departments.find(d => d.id === coordinatorDeptId)
        departmentName = dept?.name || 'Your Department'
    }

    const stats = await getShiftStatistics(startDate, endDate, coordinatorDeptId || undefined)

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Reports & Statistics</h2>
                {coordinatorDeptId && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center gap-1">
                        <AlertCircle size={14} />
                        {departmentName}
                    </span>
                )}
            </div>

            <p className="text-slate-500 mb-8">
                Overview of the last 30 days ({startDate.toLocaleDateString()} - {endDate.toLocaleDateString()})
                {coordinatorDeptId && <span className="ml-1">for your department</span>}
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Shifts</p>
                            <p className="text-3xl font-bold text-slate-800">{stats.totalShifts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Building2 className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{coordinatorDeptId ? 'Your Department' : 'Active Departments'}</p>
                            <p className="text-3xl font-bold text-slate-800">{stats.byDepartment.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Staff</p>
                            <p className="text-3xl font-bold text-slate-800">{stats.topStaff.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Shifts by Department */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {coordinatorDeptId ? 'Department Shifts' : 'Shifts by Department'}
                    </h3>
                    <div className="space-y-3">
                        {stats.byDepartment.map((dept) => {
                            const maxCount = stats.byDepartment[0]?.count || 1
                            const percentage = (dept.count / maxCount) * 100
                            return (
                                <div key={dept.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                                        <span className="text-sm text-slate-500">{dept.count} shifts</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: dept.color
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {stats.byDepartment.length === 0 && (
                            <p className="text-slate-400 italic">No data available</p>
                        )}
                    </div>
                </div>

                {/* Top Staff */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {coordinatorDeptId ? 'Staff Shifts' : 'Top Staff by Shifts'}
                    </h3>
                    <div className="space-y-3">
                        {stats.topStaff.map((staff, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{staff.name}</p>
                                    <p className="text-xs text-slate-500">{staff.department}</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {staff.count} shifts
                                </div>
                            </div>
                        ))}
                        {stats.topStaff.length === 0 && (
                            <p className="text-slate-400 italic">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
