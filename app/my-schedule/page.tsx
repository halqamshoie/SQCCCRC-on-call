import { getMySchedule } from '@/lib/actions'
import { MyScheduleView } from '@/components/MyScheduleView'
import { Activity, Home, CalendarDays, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

export default async function MySchedulePage() {
    const user = await getCurrentUser()
    const today = formatDate(new Date())

    // Auto-fetch schedule if user is logged in
    const schedule = user ? await getMySchedule(user.displayName) : null

    return (
        <main className="min-h-screen p-4 md:p-8 lg:p-12">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
                        <Activity className="text-blue-600" size={32} />
                        <span>My Schedule</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">Your past and upcoming on-call assignments</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                    <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-slate-700">{today}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <Link
                            href="/"
                            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 flex items-center gap-1"
                        >
                            <Home size={16} />
                            Dashboard
                        </Link>
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-3 bg-white p-1 pr-2 rounded-full border border-slate-200 shadow-sm">
                                <div className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                    {user.displayName}
                                </div>
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

            <div className="max-w-4xl mx-auto">
                {/* Not logged in */}
                {!user && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                        <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
                        <h2 className="text-xl font-bold text-amber-800 mb-2">Login Required</h2>
                        <p className="text-amber-600 mb-4">Please login to view your on-call schedule.</p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                        >
                            Login Now
                        </Link>
                    </div>
                )}

                {/* User logged in but no matching doctor found */}
                {user && schedule && !schedule.found && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                        <CalendarDays size={48} className="mx-auto mb-4 text-slate-400" />
                        <h2 className="text-xl font-bold text-slate-700 mb-2">No Schedule Found</h2>
                        <p className="text-slate-500 mb-2">
                            We couldn't find a staff record matching "{user.displayName}".
                        </p>
                        <p className="text-sm text-slate-400">
                            If you have on-call duties, please contact your department administrator.
                        </p>
                    </div>
                )}

                {/* User has schedule - show with view toggle */}
                {user && schedule && schedule.found && schedule.doctorName && (
                    <MyScheduleView
                        shifts={schedule.shifts as any}
                        nextShiftIndex={schedule.nextShiftIndex}
                        doctorName={schedule.doctorName}
                    />
                )}
            </div>
        </main>
    )
}
