'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeftRight, Loader2, MessageSquare, X } from 'lucide-react'

type SwapRequest = {
    id: number
    status: string
    reason: string | null
    adminNotes: string | null
    reviewedBy: string | null
    createdAt: string
    requester: {
        id: number
        name: string
        department: { name: string; code: string }
    }
    target: {
        id: number
        name: string
        department: { name: string; code: string }
    } | null
    requesterShift: {
        id: number
        date: string
        endDate: string | null
        tier: { name: string }
        specialty: { name: string } | null
    }
    targetShift: {
        id: number
        date: string
        endDate: string | null
        tier: { name: string }
        specialty: { name: string } | null
    } | null
}

type Props = {
    initialRequests: SwapRequest[]
    initialTotal: number
    initialTotalPages: number
    staffList: Array<{
        id: number
        name: string
        department: { name: string }
        shifts: Array<{
            id: number
            date: string
            endDate: string | null
            tier: { name: string }
            specialty: { name: string } | null
        }>
    }>
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
    APPROVED: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle },
    REJECTED: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: XCircle },
    CANCELLED: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500', icon: X },
}

export function SwapRequestsClient({ initialRequests, initialTotal, initialTotalPages, staffList }: Props) {
    const [requests, setRequests] = useState<SwapRequest[]>(initialRequests)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showNotesModal, setShowNotesModal] = useState<{ id: number; action: 'APPROVED' | 'REJECTED' } | null>(null)
    const [adminNotes, setAdminNotes] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Create form state
    const [selectedRequester, setSelectedRequester] = useState<number | null>(null)
    const [selectedShift, setSelectedShift] = useState<number | null>(null)
    const [selectedTarget, setSelectedTarget] = useState<number | null>(null)
    const [selectedTargetShift, setSelectedTargetShift] = useState<number | null>(null)
    const [swapReason, setSwapReason] = useState('')

    async function fetchRequests() {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/swap-requests?${params}`)
        const data = await res.json()
        setRequests(data.requests)
    }

    async function handleReview(id: number, status: 'APPROVED' | 'REJECTED') {
        setError('')
        setSuccess('')
        startTransition(async () => {
            try {
                const { reviewSwapRequest } = await import('@/lib/swap-actions')
                const result = await reviewSwapRequest(id, status, adminNotes)
                if (result.success) {
                    setSuccess(`Request ${status.toLowerCase()} successfully`)
                    setShowNotesModal(null)
                    setAdminNotes('')
                    await fetchRequests()
                } else {
                    setError(result.error || 'Failed to process request')
                }
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    async function handleCancel(id: number) {
        if (!confirm('Cancel this swap request?')) return
        setError('')
        startTransition(async () => {
            try {
                const { cancelSwapRequest } = await import('@/lib/swap-actions')
                const result = await cancelSwapRequest(id)
                if (result.success) {
                    setSuccess('Request cancelled')
                    await fetchRequests()
                } else {
                    setError(result.error || 'Failed to cancel')
                }
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    async function handleCreate() {
        if (!selectedRequester || !selectedShift) {
            setError('Please select a staff member and their shift')
            return
        }
        setError('')
        startTransition(async () => {
            try {
                const { createSwapRequest } = await import('@/lib/swap-actions')
                const result = await createSwapRequest({
                    requesterShiftId: selectedShift!,
                    targetShiftId: selectedTargetShift || undefined,
                    requesterId: selectedRequester!,
                    targetId: selectedTarget || undefined,
                    reason: swapReason || undefined
                })
                if (result.success) {
                    setSuccess('Swap request created!')
                    setShowCreateModal(false)
                    resetCreateForm()
                    await fetchRequests()
                } else {
                    setError(result.error || 'Failed to create')
                }
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    function resetCreateForm() {
        setSelectedRequester(null)
        setSelectedShift(null)
        setSelectedTarget(null)
        setSelectedTargetShift(null)
        setSwapReason('')
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const requesterStaff = staffList.find(s => s.id === selectedRequester)
    const targetStaff = staffList.find(s => s.id === selectedTarget)

    const statusTabs = [
        { value: '', label: 'All' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ]

    return (
        <div className="space-y-6">
            {/* Status Messages */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
                </div>
            )}
            {success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">{success}</span>
                    <button onClick={() => setSuccess('')} className="ml-auto"><X size={16} /></button>
                </div>
            )}

            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {statusTabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => { setStatusFilter(tab.value); setTimeout(fetchRequests, 0) }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === tab.value
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <ArrowLeftRight size={16} />
                    New Swap Request
                </button>
            </div>

            {/* Requests List */}
            <div className="space-y-3">
                {requests.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <ArrowLeftRight size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No swap requests found.</p>
                    </div>
                ) : (
                    requests.map(req => {
                        const style = STATUS_STYLES[req.status] || STATUS_STYLES.PENDING
                        const StatusIcon = style.icon
                        return (
                            <div key={req.id} className={`bg-white rounded-lg border shadow-sm overflow-hidden ${style.bg}`}>
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.text} ${style.bg} border`}>
                                                    <StatusIcon size={12} />
                                                    {req.status}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    #{req.id} • {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>

                                            {/* Swap Details */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {/* Requester */}
                                                <div className="bg-white rounded-lg border border-slate-200 p-3 min-w-[200px]">
                                                    <div className="text-xs text-slate-400 font-medium mb-1">From</div>
                                                    <div className="font-bold text-slate-800 text-sm">{req.requester.name}</div>
                                                    <div className="text-xs text-slate-500">{req.requester.department.name}</div>
                                                    <div className="mt-1.5 text-xs">
                                                        <span className="text-indigo-600 font-medium">{formatDate(req.requesterShift.date)}</span>
                                                        {req.requesterShift.endDate && (
                                                            <span className="text-slate-400"> → {formatDate(req.requesterShift.endDate)}</span>
                                                        )}
                                                    </div>
                                                    <span className="inline-block mt-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                        {req.requesterShift.tier.name}
                                                    </span>
                                                </div>

                                                <ArrowLeftRight size={20} className="text-slate-300" />

                                                {/* Target */}
                                                <div className="bg-white rounded-lg border border-slate-200 p-3 min-w-[200px]">
                                                    <div className="text-xs text-slate-400 font-medium mb-1">To</div>
                                                    {req.target ? (
                                                        <>
                                                            <div className="font-bold text-slate-800 text-sm">{req.target.name}</div>
                                                            <div className="text-xs text-slate-500">{req.target.department.name}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 italic">Open request — anyone can take this shift</div>
                                                    )}
                                                    {req.targetShift && (
                                                        <>
                                                            <div className="mt-1.5 text-xs">
                                                                <span className="text-indigo-600 font-medium">{formatDate(req.targetShift.date)}</span>
                                                            </div>
                                                            <span className="inline-block mt-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                {req.targetShift.tier.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            {req.reason && (
                                                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded flex items-start gap-1.5">
                                                    <MessageSquare size={12} className="mt-0.5 text-slate-400 shrink-0" />
                                                    {req.reason}
                                                </div>
                                            )}

                                            {/* Admin Notes */}
                                            {req.adminNotes && (
                                                <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 p-2 rounded">
                                                    <span className="font-medium">Admin: </span>{req.adminNotes}
                                                    {req.reviewedBy && <span className="text-indigo-400"> — {req.reviewedBy}</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {req.status === 'PENDING' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => { setShowNotesModal({ id: req.id, action: 'APPROVED' }); setAdminNotes('') }}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => { setShowNotesModal({ id: req.id, action: 'REJECTED' }); setAdminNotes('') }}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(req.id)}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition-colors disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Notes Modal for Approve/Reject */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-3">
                            {showNotesModal.action === 'APPROVED' ? '✅ Approve' : '❌ Reject'} Swap Request
                        </h3>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Optional notes..."
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2 mt-4 justify-end">
                            <button
                                onClick={() => setShowNotesModal(null)}
                                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReview(showNotesModal.id, showNotesModal.action)}
                                disabled={isPending}
                                className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 ${showNotesModal.action === 'APPROVED'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    } disabled:opacity-50`}
                            >
                                {isPending && <Loader2 size={14} className="animate-spin" />}
                                Confirm {showNotesModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Swap Request Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <ArrowLeftRight size={20} className="text-indigo-500" />
                            New Swap Request
                        </h3>

                        <div className="space-y-4">
                            {/* Requester */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Staff Member (requesting swap)</label>
                                <select
                                    value={selectedRequester || ''}
                                    onChange={e => { setSelectedRequester(Number(e.target.value) || null); setSelectedShift(null) }}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select staff...</option>
                                    {staffList.filter(s => s.shifts.length > 0).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.department.name})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Requester Shift */}
                            {requesterStaff && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift to swap</label>
                                    <select
                                        value={selectedShift || ''}
                                        onChange={e => setSelectedShift(Number(e.target.value) || null)}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select shift...</option>
                                        {requesterStaff.shifts.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {formatDate(s.date)} - {s.tier.name}{s.specialty ? ` (${s.specialty.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <hr className="border-slate-200" />

                            {/* Target (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Swap with (optional)
                                </label>
                                <select
                                    value={selectedTarget || ''}
                                    onChange={e => { setSelectedTarget(Number(e.target.value) || null); setSelectedTargetShift(null) }}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Open request (anyone)</option>
                                    {staffList.filter(s => s.id !== selectedRequester && s.shifts.length > 0).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.department.name})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Shift */}
                            {targetStaff && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Their shift to take</label>
                                    <select
                                        value={selectedTargetShift || ''}
                                        onChange={e => setSelectedTargetShift(Number(e.target.value) || null)}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select shift...</option>
                                        {targetStaff.shifts.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {formatDate(s.date)} - {s.tier.name}{s.specialty ? ` (${s.specialty.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                                <textarea
                                    value={swapReason}
                                    onChange={e => setSwapReason(e.target.value)}
                                    placeholder="e.g., Personal appointment, conference, etc."
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6 justify-end">
                            <button
                                onClick={() => { setShowCreateModal(false); resetCreateForm() }}
                                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isPending || !selectedRequester || !selectedShift}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPending && <Loader2 size={14} className="animate-spin" />}
                                Create Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
