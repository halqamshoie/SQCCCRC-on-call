'use client'

import { useState } from 'react'
import { ShiftCard } from './ShiftCard'

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
    shifts: Shift[]
    doctors: { id: number; name: string; departmentId: number; specialty?: { name: string } | null }[]
    tiers: { id: number; name: string; specialtyId?: number | null }[]
}

export function ShiftList({ shifts, doctors, tiers }: Props) {
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null)

    return (
        <div className="space-y-3">
            {shifts.map(shift => (
                <ShiftCard
                    key={shift.id}
                    shift={shift}
                    doctors={doctors}
                    tiers={tiers}
                    isEditing={editingShiftId === shift.id}
                    onStartEdit={() => setEditingShiftId(shift.id)}
                    onEndEdit={() => setEditingShiftId(null)}
                    canEdit={editingShiftId === null}
                />
            ))}
            {shifts.length === 0 && (
                <p className="text-slate-400 text-sm italic">No shifts assigned for today.</p>
            )}
        </div>
    )
}
