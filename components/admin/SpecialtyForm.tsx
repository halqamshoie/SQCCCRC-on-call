'use client'

import { createSpecialty, updateSpecialty } from "@/lib/specialty-actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

type SpecialtyFormProps = {
    departmentId: number
    specialty?: {
        id: number
        name: string
        description: string | null
        isActive: boolean
    }
    onSuccess?: () => void
}

export function SpecialtyForm({ departmentId, specialty, onSuccess }: SpecialtyFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const isEditing = !!specialty

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = e.currentTarget
        const formData = new FormData(form)
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const isActive = formData.get('isActive') === 'on'

        try {
            let result
            if (isEditing) {
                result = await updateSpecialty(specialty.id, {
                    name,
                    description: description || undefined,
                    isActive
                })
            } else {
                result = await createSpecialty({
                    name,
                    departmentId,
                    description: description || undefined
                })
            }

            if (result && result.success) {
                router.refresh()
                if (onSuccess) {
                    onSuccess()
                } else {
                    if (!isEditing) {
                        form.reset()
                    }
                }
            } else {
                setError(result?.error || 'An error occurred')
            }
        } catch (err) {
            console.error('Error in specialty form submission:', err)
            setError('Failed to save specialty')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialty Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    required
                    defaultValue={specialty?.name}
                    placeholder="e.g., Cardiology"
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    defaultValue={specialty?.description || ''}
                    placeholder="Brief description of this specialty"
                    rows={2}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 text-sm"
                />
            </div>

            {isEditing && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        id={`specialty-active-${specialty.id}`}
                        defaultChecked={specialty.isActive}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                    />
                    <label htmlFor={`specialty-active-${specialty.id}`} className="text-sm font-medium text-slate-700">
                        Active
                    </label>
                </div>
            )}

            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-1.5 px-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add Specialty')}
                </button>
                {onSuccess && (
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )
}
