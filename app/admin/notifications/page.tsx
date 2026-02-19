import { requireAdmin } from "@/lib/rbac"
import { NotificationsClient } from "@/components/admin/NotificationsClient"

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
    await requireAdmin()

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Email Notifications</h2>
            <p className="text-sm text-slate-500 mb-6">
                Send shift reminder emails to staff the day before their on-call shifts.
            </p>
            <NotificationsClient />
        </div>
    )
}
