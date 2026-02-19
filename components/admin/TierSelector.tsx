'use client'

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { syncTiers } from "@/lib/tier-actions"

type TierTemplate = {
    id: string
    name: string
    level: number
    responseTime: number
}

const TIER_TEMPLATES: TierTemplate[] = [
    { id: '1st', name: '1st Call', level: 1, responseTime: 15 },
    { id: '2nd', name: '2nd Call', level: 2, responseTime: 30 },
    { id: '3rd', name: '3rd Call', level: 3, responseTime: 60 },
    { id: 'consultant', name: 'Consultant', level: 4, responseTime: 120 },
    { id: 'tech', name: 'Technologist', level: 1, responseTime: 20 },
    { id: 'senior_tech', name: 'Senior Technologist', level: 2, responseTime: 30 },
    { id: 'supervisor', name: 'Supervisor', level: 3, responseTime: 45 },
]

// Group for easier selection based on user request
const DISPLAY_GROUPS = [
    {
        label: 'Medical / Surgical Tiers',
        options: [
            { id: '1st', label: '1st On Call' },
            { id: '2nd', label: '2nd On Call' },
            { id: 'consultant', label: '3rd On Call / Consultant' }
        ]
    },
    {
        label: 'Technical / Support Tiers',
        options: [
            { id: 'tech', label: 'Technologist' },
            { id: 'senior_tech', label: 'Senior Technologist' },
            { id: 'supervisor', label: 'Supervisor' }
        ]
    }
]

type TierSelectorProps = {
    specialtyId: number
    existingTiers: Array<{ name: string }>
    onClose: () => void
}

export function TierSelector({ specialtyId, existingTiers, onClose }: TierSelectorProps) {
    // Determine initial state based on existing tier names
    // This is a heuristic matching
    const initialSelection = new Set<string>()
    existingTiers.forEach(tier => {
        const lowerName = tier.name.toLowerCase()
        if (lowerName.includes('1st') || lowerName.includes('first')) initialSelection.add('1st')
        else if (lowerName.includes('2nd') || lowerName.includes('second')) initialSelection.add('2nd')
        // "3rd On Call / Consultant" should map to 'consultant' checkbox
        else if (lowerName.includes('3rd') || lowerName.includes('third') || lowerName.includes('consultant')) initialSelection.add('consultant')
        else if (lowerName.includes('technologist') && !lowerName.includes('senior')) initialSelection.add('tech')
        else if (lowerName.includes('senior tech')) initialSelection.add('senior_tech')
        else if (lowerName.includes('supervisor')) initialSelection.add('supervisor')
    })

    // Special handling for the user request "3rd On Call/Consultant" 
    // functionality generally implies level 3/4 escalation

    const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelection)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    function toggleSelection(id: string) {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    async function handleSave() {
        setIsSaving(true)
        setError('')

        try {
            // Map selected IDs back to templates
            const templatesToSync = Array.from(selectedIds).map(id => {
                return TIER_TEMPLATES.find(t => t.id === id)!
            }).filter(Boolean)

            // Sort by level for logic consistency
            templatesToSync.sort((a, b) => a.level - b.level)

            const result = await syncTiers(specialtyId, templatesToSync)

            if (result.success) {
                onClose()
            } else {
                setError(result.error || 'Failed to sync tiers')
            }
        } catch (err) {
            setError('An error occurred while saving')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner mt-2">
            <h4 className="font-semibold text-slate-800 text-sm mb-3">Configure On-Call Tiers</h4>

            {error && (
                <div className="mb-3 bg-red-50 text-red-600 text-xs p-2 rounded border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-4 mb-4">
                {DISPLAY_GROUPS.map((group, idx) => (
                    <div key={idx}>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group.label}</h5>
                        <div className="space-y-2">
                            {group.options.map(option => (
                                <label key={option.id} className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                            checked={selectedIds.has(option.id)}
                                            onChange={() => toggleSelection(option.id)}
                                        />
                                    </div>
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 min-w-[60px] justify-center"
                >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Save Configuration'}
                </button>
            </div>
        </div>
    )
}
