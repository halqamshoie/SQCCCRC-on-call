'use client'

import { createDepartment, updateDepartment } from "@/lib/department-actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle } from "lucide-react"

const TIER_OPTIONS = [
    {
        label: 'Medical / Surgical',
        tiers: [
            { id: '1st', name: '1st On Call', level: 1, responseTime: 15 },
            { id: '2nd', name: '2nd On Call', level: 2, responseTime: 30 },
            { id: 'consultant', name: '3rd On Call / Consultant', level: 3, responseTime: 60 },
        ]
    },
    {
        label: 'Technical / Support',
        tiers: [
            { id: 'tech', name: 'Technologist', level: 1, responseTime: 20 },
            { id: 'senior_tech', name: 'Senior Technologist', level: 2, responseTime: 30 },
            { id: 'supervisor', name: 'Supervisor', level: 3, responseTime: 45 },
        ]
    },
    {
        label: 'Other',
        tiers: [
            { id: 'oncall_staff', name: 'On-call Staff', level: 1, responseTime: 15 },
        ]
    }
]

type DepartmentFormProps = {
    department?: {
        id: number
        name: string
        code: string
        color: string
        isActive: boolean
        isClinical?: boolean
    }
    onSuccess?: () => void
}

type FormMessage = {
    type: 'success' | 'error'
    text: string
}

export function DepartmentForm({ department, onSuccess }: DepartmentFormProps) {
    const router = useRouter()
    const [message, setMessage] = useState<FormMessage | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set())

    const isEditing = !!department

    function toggleTier(id: string) {
        setSelectedTiers(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setMessage(null)
        setLoading(true)

        const form = e.currentTarget // Store reference before async operations
        const formData = new FormData(form)
        const name = formData.get('name') as string
        const code = formData.get('code') as string
        const color = formData.get('color') as string
        const isClinical = formData.get('isClinical') === 'on'
        const isActive = formData.get('isActive') === 'on'

        // Collect selected tier templates
        const tierTemplates = TIER_OPTIONS.flatMap(g => g.tiers).filter(t => selectedTiers.has(t.id))

        try {
            let result
            if (isEditing) {
                result = await updateDepartment(department.id, {
                    name,
                    code,
                    color,
                    isClinical,
                    isActive
                })
            } else {
                result = await createDepartment({
                    name,
                    code,
                    color,
                    isClinical,
                    tiers: tierTemplates.map(t => ({ name: t.name, level: t.level, responseTimeMinutes: t.responseTime }))
                })
            }

            if (result && result.success) {
                setMessage({ type: 'success', text: isEditing ? 'Department updated successfully' : `Department "${name}" created successfully` })
                setTimeout(() => router.refresh(), 300)
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 500)
                } else {
                    // Reset form if creating new
                    if (!isEditing) {
                        form.reset()
                        setSelectedTiers(new Set())
                    }
                }
            } else {
                setMessage({ type: 'error', text: result?.error || 'An error occurred' })
            }
        } catch (err) {
            console.error('Error in form submission:', err)
            setMessage({ type: 'error', text: 'Failed to save department' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {isEditing ? 'Edit Department' : 'Add New Department'}
            </h3>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    required
                    defaultValue={department?.name}
                    placeholder="e.g., Emergency Services"
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department Code <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="code"
                    required
                    defaultValue={department?.code}
                    placeholder="e.g., EMERG (uppercase, unique)"
                    maxLength={10}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 uppercase"
                    style={{ textTransform: 'uppercase' }}
                />
                <p className="text-xs text-slate-500 mt-1">Short unique code for this department</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Color
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        name="color"
                        defaultValue={department?.color || '#3B82F6'}
                        className="h-10 w-20 border border-slate-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-slate-600">Used for UI theming and badges</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="isClinical"
                    id="isClinical"
                    defaultChecked={department?.isClinical ?? true}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                />
                <label htmlFor="isClinical" className="text-sm font-medium text-slate-700">
                    Clinical Department (has doctors)
                </label>
            </div>

            {/* Tier Selection - only for new departments */}
            {!isEditing && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        On-Call Tiers
                    </label>
                    <p className="text-xs text-slate-500 mb-3">Select tiers to auto-create with a &quot;General&quot; specialty</p>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {TIER_OPTIONS.map((group, gIdx) => (
                            <div key={gIdx}>
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{group.label}</h5>
                                <div className="space-y-1.5">
                                    {group.tiers.map(tier => (
                                        <label key={tier.id} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                                checked={selectedTiers.has(tier.id)}
                                                onChange={() => toggleTier(tier.id)}
                                            />
                                            <span className="text-sm text-slate-700 group-hover:text-slate-900">{tier.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        id="isActive"
                        defaultChecked={department.isActive}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                        Active
                    </label>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : (isEditing ? 'Update Department' : 'Create Department')}
                </button>
                {onSuccess && (
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-300 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )
}
