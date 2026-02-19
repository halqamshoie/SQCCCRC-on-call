import { getEmergencyCodes, getOnCallStaffGroupedByDepartment } from '@/lib/actions'
import { CodeStatus } from '@/components/CodeStatus'
import { DepartmentSearch } from '@/components/DepartmentSearch'
import { Activity, Shield, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic' // Ensure real-time data

export default async function Home() {
  const user = await getCurrentUser()
  const codes = await getEmergencyCodes()
  const groupedShifts = await getOnCallStaffGroupedByDepartment()
  const today = formatDate(new Date())

  const departmentEntries = Object.values(groupedShifts) as any[]

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
            <Activity className="text-blue-600" size={32} />
            <span className="hidden sm:inline">SQCCCRC</span>
            <span className="sm:hidden">SQCCCRC</span>
            <span className="text-slate-400 font-light hidden md:inline">On-Call Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Comprehensive Cancer Care and Research Centre</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xl md:text-2xl font-bold text-slate-700">{today}</p>
            <p className="text-slate-400 text-xs md:text-sm">Real-time Status Monitor</p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white p-1 pr-2 rounded-full border border-slate-200 shadow-sm">
                <div className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                  {user.displayName}
                </div>

                <Link
                  href="/my-schedule"
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1"
                >
                  <Calendar size={14} />
                  <span className="hidden sm:inline">My Schedule</span>
                </Link>

                {(user.role === 'ADMIN' || user.role === 'COORDINATOR') && (
                  <Link
                    href="/admin"
                    className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Shield size={14} />
                    <span className="hidden sm:inline">
                      {user.role === 'COORDINATOR' ? 'Coordinator Panel' : 'Admin Panel'}
                    </span>
                  </Link>
                )}

                <div className="w-px h-4 bg-slate-200 mx-1"></div>

                <LogoutButton variant="header" />
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Emergency Status</h2>
        <CodeStatus codes={codes} />
      </section>

      {/* Department Search and Listing */}
      <DepartmentSearch departmentEntries={departmentEntries} />
    </main>
  )
}

