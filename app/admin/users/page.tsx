import { getAllUsers } from "@/lib/user-actions"
import { getDepartments } from "@/lib/department-actions"
import { UserList } from "@/components/admin/UserList"
import { AddUserForm } from "@/components/admin/AddUserForm"
import { requireAdmin } from "@/lib/rbac"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    // Require ADMIN role
    await requireAdmin()

    const users = await getAllUsers()
    const departments = await getDepartments()

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">User Management</h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Add User Panel */}
                <div className="xl:col-span-1">
                    <AddUserForm departments={departments} />
                </div>

                {/* Users List */}
                <div className="xl:col-span-2">
                    <UserList users={users} departments={departments} />
                </div>
            </div>
        </div>
    )
}
