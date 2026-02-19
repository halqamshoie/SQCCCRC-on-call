import { requireAdmin } from '@/lib/rbac'
import { AuditLogClient } from '@/components/admin/AuditLogClient'

export default async function AuditLogPage() {
    await requireAdmin()

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Log</h1>
                <p className="text-slate-500 mt-1">Track all administrative actions in the system.</p>
            </div>

            <AuditLogClient />
        </div>
    )
}
