import { getAllDoctors, getDepartments } from "@/lib/admin-actions"
import { getAllSpecialties } from "@/lib/specialty-actions"
import { DoctorsClient } from "./DoctorsClient"
import { requireAdminOrCoordinator } from "@/lib/rbac"

export const dynamic = 'force-dynamic'

export default async function DoctorsPage() {
    const user = await requireAdminOrCoordinator()

    // If user is a coordinator, filter by their assigned department
    const departmentId = user.role === 'COORDINATOR' ? user.departmentId ?? undefined : undefined

    const doctors = await getAllDoctors(departmentId)
    const departments = await getDepartments()
    const specialties = await getAllSpecialties()

    return (
        <DoctorsClient
            doctors={doctors}
            departments={departments}
            specialties={specialties}
            userRole={user.role}
            userDepartmentId={user.departmentId}
        />
    )
}
