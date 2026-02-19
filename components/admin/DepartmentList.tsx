'use client'

import { deleteDepartment } from "@/lib/department-actions"
import { useState } from "react"
import { Pencil, Trash2, ChevronDown, ChevronRight, CheckCircle, AlertCircle, AlertTriangle, Search, X, Filter } from "lucide-react"
import { DepartmentForm } from "./DepartmentForm"
import { SpecialtyList } from "./SpecialtyList"
import { useRouter } from "next/navigation"

type Department = {
    id: number
    name: string
    code: string
    color: string
    isClinical: boolean
    isActive: boolean
    _count: {
        specialties: number
        doctors: number
    }
    specialties?: Array<{
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
    }>
}

type DepartmentListProps = {
    departments: Department[]
}

type Message = {
    type: 'success' | 'error' | 'warning'
    text: string
}

export function DepartmentList({ departments }: DepartmentListProps) {
    const router = useRouter()
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const [message, setMessage] = useState<Message | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [clinicalFilter, setClinicalFilter] = useState<'all' | 'clinical' | 'non-clinical'>('all')
    const [selectedDeptId, setSelectedDeptId] = useState<string>('')

    function toggleExpand(id: number) {
        setExpandedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    async function handleDelete(dept: Department) {
        const confirmMsg = dept.isActive
            ? 'Deactivate this department? (You can permanently delete it after deactivation)'
            : '⚠️ PERMANENTLY DELETE this department? This cannot be undone!'

        if (!confirm(confirmMsg)) return

        setDeletingId(dept.id)
        setMessage(null)
        try {
            const result = await deleteDepartment(dept.id)
            if (result.success) {
                setMessage({
                    type: result.action === 'deleted' ? 'success' : 'warning',
                    text: result.message || 'Operation completed'
                })
                setTimeout(() => router.refresh(), 300)
            } else {
                setMessage({ type: 'error', text: result.error || 'Operation failed' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setDeletingId(null)
            setTimeout(() => setMessage(null), 5000)
        }
    }

    // Filter logic
    const filteredDepartments = departments.filter(dept => {
        // Department dropdown filter
        if (selectedDeptId && dept.id.toString() !== selectedDeptId) return false

        // Clinical/Non-clinical filter
        if (clinicalFilter === 'clinical' && !dept.isClinical) return false
        if (clinicalFilter === 'non-clinical' && dept.isClinical) return false

        // Search filter
        const query = searchQuery.toLowerCase().trim()
        if (!query) return true
        if (dept.name.toLowerCase().includes(query)) return true
        if (dept.code.toLowerCase().includes(query)) return true
        // Search in specialties
        if (dept.specialties?.some(s => s.name.toLowerCase().includes(query))) return true
        // Search in tier names
        if (dept.specialties?.some(s => s.onCallTiers?.some(t => t.name.toLowerCase().includes(query)))) return true
        return false
    })

    const hasActiveFilters = searchQuery || clinicalFilter !== 'all' || selectedDeptId

    return (
        <div className="space-y-4">
            {/* Search & Filters Bar */}
            <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search departments, specialties, tiers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-3 flex-wrap">
                    {/* Clinical / Non-Clinical Toggle */}
                    <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
                        {(['all', 'clinical', 'non-clinical'] as const).map(option => (
                            <button
                                key={option}
                                onClick={() => setClinicalFilter(option)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${clinicalFilter === option
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                {option === 'all' ? 'All' : option === 'clinical' ? 'Clinical' : 'Non-Clinical'}
                            </button>
                        ))}
                    </div>

                    {/* Department Dropdown */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            <optgroup label="Clinical">
                                {departments.filter(d => d.isClinical).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Non-Clinical">
                                {departments.filter(d => !d.isClinical).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setClinicalFilter('all')
                                setSelectedDeptId('')
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results info */}
            {hasActiveFilters && (
                <p className="text-xs text-slate-500">
                    Showing {filteredDepartments.length} of {departments.length} departments
                </p>
            )}

            {/* Message Display */}
            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> :
                        message.type === 'warning' ? <AlertTriangle size={18} /> :
                            <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Department List */}
            {filteredDepartments.map(dept => {
                const isExpanded = expandedIds.has(dept.id)
                // Collect all tiers across all specialties
                const allTiers = dept.specialties?.flatMap(s =>
                    (s.onCallTiers || []).map(t => t.name)
                ) || []
                const uniqueTiers = [...new Set(allTiers)]

                return (
                    <div key={dept.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        {editingId === dept.id ? (
                            <div className="p-4">
                                <DepartmentForm
                                    department={dept}
                                    onSuccess={() => setEditingId(null)}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div
                                                className="w-4 h-4 rounded flex-shrink-0"
                                                style={{ backgroundColor: dept.color }}
                                                title={`Color: ${dept.color}`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-slate-800">{dept.name}</h3>
                                                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                        {dept.code}
                                                    </span>
                                                    {dept.isClinical ? (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            Clinical
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                                            Non-Clinical
                                                        </span>
                                                    )}
                                                    {!dept.isActive && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Tier badges */}
                                                {uniqueTiers.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                        {uniqueTiers.map((tierName, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100"
                                                            >
                                                                {tierName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => toggleExpand(dept.id)}
                                                    className="text-sm text-slate-500 mt-1 hover:text-slate-700 transition-colors flex items-center gap-1"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                    <span>
                                                        {dept._count.specialties} {dept._count.specialties === 1 ? 'specialty' : 'specialties'} • {' '}
                                                        {dept._count.doctors} {dept.isClinical
                                                            ? (dept._count.doctors === 1 ? 'doctor' : 'doctors')
                                                            : (dept._count.doctors === 1 ? 'staff' : 'staff')}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingId(dept.id)}
                                                className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Edit department"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept)}
                                                disabled={deletingId === dept.id}
                                                className={`p-2 transition-colors disabled:opacity-50 ${dept.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-red-500 hover:text-red-700'}`}
                                                title={dept.isActive ? 'Deactivate department' : 'Permanently delete department'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Specialty Section */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200 bg-slate-50 px-4 pb-4">
                                        <SpecialtyList
                                            departmentId={dept.id}
                                            specialties={dept.specialties || []}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )
            })}

            {filteredDepartments.length === 0 && (
                <p className="text-slate-400 text-center py-8 italic">
                    {hasActiveFilters ? 'No departments match your filters.' : 'No departments found. Add one to get started.'}
                </p>
            )}
        </div>
    )
}
