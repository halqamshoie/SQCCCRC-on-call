import { getEmergencyCodes, getOnCallStaff } from "@/lib/actions"
import { getDepartments } from "@/lib/department-actions"
import { getAllDoctors, getAllTiers } from "@/lib/admin-actions"
import { CodeToggle } from "@/components/admin/CodeToggle"
import { ShiftForm } from "@/components/admin/ShiftForm"
import { ShiftList } from "@/components/admin/ShiftList"
import { requireAdminOrCoordinator } from "@/lib/rbac"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const user = await requireAdminOrCoordinator()

    // Determine filter based on role
    // ADMIN sees all (undefined filter)
    // COORDINATOR sees only their department
    const departmentId = user.role === 'COORDINATOR' ? ((user as any).departmentId || undefined) : undefined

    const codes = await getEmergencyCodes()
    const shifts = await getOnCallStaff({ departmentId })
    const doctors = await getAllDoctors(departmentId)
    const tiers = await getAllTiers()
    const departments = await getDepartments()

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">System Overview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Helper Panel: Emergency Codes */}
                <section>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Emergency Codes Status</h3>
                    <div className="grid gap-3">
                        {codes.map(code => (
                            <CodeToggle key={code.id} code={code} />
                        ))}
                    </div>
                </section>

                {/* Action Panel: Schedule */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-700">Manage Schedule</h3>
                    </div>

                    <div className="mb-8">
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
                                role: user.role,
                                departmentId: (user as any).departmentId
                            }}
                        />
                    </div>

                    <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-widest mb-3">Active Shifts (Today)</h4>
                    <ShiftList
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
                                    isClinical: shift.doctor.department.isClinical
                                }
                            },
                            tier: { id: shift.tier.id, name: shift.tier.name }
                        }))}
                        doctors={doctors.map(d => ({
                            id: d.id,
                            name: d.name,
                            departmentId: d.departmentId,
                            specialty: d.specialty
                        }))}
                        tiers={tiers.map(t => ({ id: t.id, name: t.name, specialtyId: t.specialtyId }))}
                    />
                </section>
            </div>
        </div>
    )
}
