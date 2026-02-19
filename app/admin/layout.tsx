import Link from "next/link"
import { LayoutDashboard, Users, MonitorPlay, LogOut, Shield, Building2, History, BarChart3, Calendar, Bell, ArrowLeftRight, ClipboardList } from "lucide-react"
import { LogoutButton } from "@/components/LogoutButton"
import { getCurrentUser } from "@/lib/auth"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold tracking-wider">
                        {user?.role === 'COORDINATOR' ? 'Coordinator Panel' : 'Admin Panel'}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">SQCCCRC On-Call System</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>

                    <Link href="/admin/shifts" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Calendar size={20} />
                        <span>Manage Shifts</span>
                    </Link>

                    <Link href="/admin/history" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <History size={20} />
                        <span>Shift History</span>
                    </Link>

                    <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <BarChart3 size={20} />
                        <span>Reports</span>
                    </Link>

                    {/* Admin-only: Departments */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin/departments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <Building2 size={20} />
                            <span>Departments</span>
                        </Link>
                    )}

                    <Link href="/admin/doctors" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Users size={20} />
                        <span>Manage Staff</span>
                    </Link>

                    {/* Admin-only: User Management */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <Shield size={20} />
                            <span>User Management</span>
                        </Link>
                    )}

                    {/* Admin-only: Notifications */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <Bell size={20} />
                            <span>Notifications</span>
                        </Link>
                    )}

                    {/* Swap Requests - Admin and Coordinator */}
                    {(user?.role === 'ADMIN' || user?.role === 'COORDINATOR') && (
                        <Link href="/admin/swap-requests" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeftRight size={20} />
                            <span>Swap Requests</span>
                        </Link>
                    )}

                    {/* Admin-only: Audit Log */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin/audit-log" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <ClipboardList size={20} />
                            <span>Audit Log</span>
                        </Link>
                    )}

                    <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-blue-300">
                        <MonitorPlay size={20} />
                        <span>Public View</span>
                    </Link>
                </nav>

                <div className="p-6 border-t border-slate-700">
                    {user && (
                        <div className="mb-4">
                            <p className="text-sm font-medium text-white">{user.displayName}</p>
                            <p className="text-xs text-slate-400">{user.role}</p>
                        </div>
                    )}
                    <LogoutButton />
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    )
}
