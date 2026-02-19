'use client'

import { useState } from 'react'
import { Trash2, Pencil, X, Check, Loader2 } from 'lucide-react'
import { deleteShift, updateShift } from '@/lib/admin-actions'

interface Shift {
    id: number
    date: string
    endDate?: string | null
    isFixed?: boolean
    notes?: string | null
    doctor: {
        id: number
        name: string
        departmentId: number
        department: { name: string; isClinical?: boolean }
    }
    tier: { id: number; name: string }
}

interface Props {
    shift: Shift
    doctors: { id: number; name: string; departmentId: number; specialty?: { name: string } | null }[]
    tiers: { id: number; name: string; specialtyId?: number | null }[]
    isEditing?: boolean
    onStartEdit?: () => void
    onEndEdit?: () => void
    canEdit?: boolean
}

export function ShiftCard({ shift, doctors, tiers, isEditing: externalIsEditing, onStartEdit, onEndEdit, canEdit = true }: Props) {
    const [internalIsEditing, setInternalIsEditing] = useState(false)

    // Use external editing state if provided, otherwise use internal
    const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing
    const setIsEditing = (value: boolean) => {
        if (externalIsEditing !== undefined) {
            if (value && onStartEdit) onStartEdit()
            if (!value && onEndEdit) onEndEdit()
        } else {
            setInternalIsEditing(value)
        }
    }
    const [isLoading, setIsLoading] = useState(false)
    const [editData, setEditData] = useState({
        doctorId: shift.doctor.id,
        tierId: shift.tier.id,
        date: new Date(shift.date).toISOString().split('T')[0],
        endDate: shift.endDate ? new Date(shift.endDate).toISOString().split('T')[0] : '',
        isFixed: shift.isFixed || false,
        notes: shift.notes || ''
    })

    // Filter doctors to only show those from the same department
    const filteredDoctors = doctors.filter(d => d.departmentId === shift.doctor.departmentId)

    // Filter tiers based on department type (clinical vs non-clinical)
    const isNonClinical = shift.doctor.department.isClinical === false
    const clinicalRoles = ['1st', '2nd', '3rd', 'consultant', 'technologist', 'senior', 'supervisor']
    const nonClinicalRoles = ['staff', 'supervisor', '1st', 'on call']

    // Filter by department type and then make distinct by name
    const seenNames = new Set<string>()
    const filteredTiers = tiers.filter(t => {
        const tierName = t.name.toLowerCase()
        // Check if role matches department type
        let matches = false
        if (isNonClinical) {
            matches = nonClinicalRoles.some(r => tierName.includes(r))
        } else {
            matches = clinicalRoles.some(r => tierName.includes(r))
        }
        // Only include if matches and name hasn't been seen
        if (matches && !seenNames.has(t.name)) {
            seenNames.add(t.name)
            return true
        }
        return false
    })

    const handleSave = async () => {
        setIsLoading(true)
        await updateShift(shift.id, {
            doctorId: editData.doctorId,
            tierId: editData.tierId,
            date: editData.date,
            endDate: editData.endDate || null,
            isFixed: editData.isFixed,
            notes: editData.notes || null
        })
        setIsLoading(false)
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this shift?')) {
            await deleteShift(shift.id)
        }
    }

    if (isEditing) {
        return (
            <div className="p-4 bg-white border-2 border-blue-300 rounded-lg shadow-md space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <span className="text-sm font-semibold text-blue-600">Editing Shift</span>
                        <span className="text-xs text-slate-400 ml-2">({shift.doctor.department.name})</span>
                    </div>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Doctor/Staff Selection - Filtered by Department */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        {shift.doctor.department.isClinical === false ? 'Staff' : 'Doctor'}
                        <span className="text-slate-400 ml-1">({filteredDoctors.length} available)</span>
                    </label>
                    <select
                        value={editData.doctorId}
                        onChange={(e) => setEditData({ ...editData, doctorId: parseInt(e.target.value) })}
                        className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white"
                    >
                        {filteredDoctors.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name} {d.specialty ? `(${d.specialty.name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tier Selection */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Role / Tier</label>
                    <select
                        value={editData.tierId}
                        onChange={(e) => setEditData({ ...editData, tierId: parseInt(e.target.value) })}
                        className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white"
                    >
                        {filteredTiers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={editData.date}
                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                            className="w-full p-2 text-sm border border-slate-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                        <input
                            type="date"
                            value={editData.endDate}
                            onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                            className="w-full p-2 text-sm border border-slate-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Fixed Checkbox */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`fixed-${shift.id}`}
                        checked={editData.isFixed}
                        onChange={(e) => setEditData({ ...editData, isFixed: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <label htmlFor={`fixed-${shift.id}`} className="text-sm text-slate-600">
                        Fixed On-Call
                    </label>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                    <input
                        type="text"
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        placeholder="Optional notes..."
                        className="w-full p-2 text-sm border border-slate-300 rounded-md"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Save
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors">
            <div className="flex-1">
                <p className="font-bold text-slate-800">{shift.doctor.name}</p>
                <p className="text-xs text-slate-500">
                    {shift.tier.name} • {shift.doctor.department.name}
                    {shift.isFixed && <span className="ml-2 text-blue-600">(Fixed)</span>}
                </p>
                {shift.endDate && (
                    <p className="text-xs text-slate-400 mt-1">
                        Until {new Date(shift.endDate).toLocaleDateString()}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setIsEditing(true)}
                    disabled={!canEdit}
                    className={`p-2 transition-colors ${canEdit ? 'text-blue-400 hover:text-blue-700' : 'text-slate-300 cursor-not-allowed'}`}
                    title={canEdit ? 'Edit shift' : 'Finish editing other shift first'}
                >
                    <Pencil size={16} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2 text-red-400 hover:text-red-700 transition-colors"
                    title="Delete shift"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}
