import { getDepartments } from "@/lib/department-actions"
import { DepartmentForm } from "@/components/admin/DepartmentForm"
import { DepartmentList } from "@/components/admin/DepartmentList"
import { requireAdmin } from "@/lib/rbac"

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage() {
    // Require ADMIN role
    await requireAdmin()

    const departments = await getDepartments()

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Department Management</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: Add new department */}
                <section className="lg:col-span-1">
                    <DepartmentForm />
                </section>

                {/* Right column: Department list */}
                <section className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">
                        All Departments ({departments.length})
                    </h3>
                    <DepartmentList departments={departments} />
                </section>
            </div>
        </div>
    )
}
