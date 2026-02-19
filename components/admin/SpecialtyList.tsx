'use client'

import { deleteSpecialty } from "@/lib/specialty-actions"
import { useState } from "react"
import { Pencil, Trash2, Settings } from "lucide-react"
import { SpecialtyForm } from "./SpecialtyForm"
import { TierSelector } from "./TierSelector"

type Specialty = {
    id: number
    name: string
    description: string | null
    isActive: boolean
    onCallTiers?: Array<{ name: string }>
    _count: {
        onCallTiers: number
        doctors: number
        shifts: number
    }
}

type SpecialtyListProps = {
    departmentId: number
    specialties: Specialty[]
}

export function SpecialtyList({ departmentId, specialties }: SpecialtyListProps) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [configuringId, setConfiguringId] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to deactivate this specialty?')) return

        setDeletingId(id)
        try {
            await deleteSpecialty(id)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="mt-3 ml-6 space-y-2">
            {/* Add Specialty Button/Form */}
            {showAddForm ? (
                <SpecialtyForm
                    departmentId={departmentId}
                    onSuccess={() => setShowAddForm(false)}
                />
            ) : (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    + Add Specialty
                </button>
            )}

            {/* Specialty List */}
            <div className="space-y-2">
                {specialties.map(spec => (
                    <div key={spec.id} className="bg-white border border-slate-200 rounded-md overflow-hidden">
                        {editingId === spec.id ? (
                            <div className="p-3">
                                <SpecialtyForm
                                    departmentId={departmentId}
                                    specialty={spec}
                                    onSuccess={() => setEditingId(null)}
                                />
                            </div>
                        ) : (
                            <div className="p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-800 text-sm">{spec.name}</h4>
                                            {!spec.isActive && (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        {spec.description && (
                                            <p className="text-xs text-slate-600 mt-1">{spec.description}</p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">
                                            {spec._count.onCallTiers} {spec._count.onCallTiers === 1 ? 'tier' : 'tiers'} • {' '}
                                            {spec._count.doctors} {spec._count.doctors === 1 ? 'doctor' : 'doctors'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            onClick={() => setConfiguringId(configuringId === spec.id ? null : spec.id)}
                                            className={`p-1.5 transition-colors ${configuringId === spec.id ? 'text-blue-700 bg-blue-50 rounded' : 'text-slate-400 hover:text-blue-600'}`}
                                            title="Manage Tiers"
                                        >
                                            <Settings size={14} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(spec.id)}
                                            className="p-1.5 text-blue-500 hover:text-blue-700 transition-colors"
                                            title="Edit specialty"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(spec.id)}
                                            disabled={deletingId === spec.id}
                                            className="p-1.5 text-red-400 hover:text-red-700 transition-colors disabled:opacity-50"
                                            title="Deactivate specialty"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {configuringId === spec.id && (
                                    <TierSelector
                                        specialtyId={spec.id}
                                        existingTiers={spec.onCallTiers || []}
                                        onClose={() => setConfiguringId(null)}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {specialties.length === 0 && !showAddForm && (
                    <p className="text-xs text-slate-400 italic py-2">
                        No specialties yet. Click "Add Specialty" to create one.
                    </p>
                )}
            </div>
        </div>
    )
}
