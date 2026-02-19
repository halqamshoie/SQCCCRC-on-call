import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSwapRequests, getStaffForSwap } from '@/lib/swap-actions'
import { SwapRequestsClient } from '@/components/admin/SwapRequestsClient'

export default async function SwapRequestsPage() {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
        redirect('/admin')
    }

    const [swapData, staffList] = await Promise.all([
        getSwapRequests(),
        getStaffForSwap()
    ])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shift Swap Requests</h1>
                <p className="text-slate-500 mt-1">Manage shift swap requests from staff members.</p>
            </div>

            <SwapRequestsClient
                initialRequests={swapData.requests as any}
                initialTotal={swapData.total}
                initialTotalPages={swapData.totalPages}
                staffList={staffList as any}
            />
        </div>
    )
}
