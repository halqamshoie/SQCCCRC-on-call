'use client'

import { useState } from 'react'
import { Search, X, Filter, Phone, Smartphone } from 'lucide-react'
import { DepartmentSection } from './DepartmentSection'

interface DepartmentData {
    department: {
        id: number
        name: string
        isClinical: boolean
        color: string
    }
    specialties: any
}

interface Props {
    departmentEntries: DepartmentData[]
}

// Extract all shifts from a department's specialties into a flat list
function extractShifts(specialties: any): any[] {
    const shifts: any[] = []
    Object.values(specialties).forEach((specData: any) => {
        if (specData.shifts) {
            specData.shifts.forEach((shift: any) => {
                shifts.push({
                    ...shift,
                    specialtyName: specData.specialty?.name || 'General'
                })
            })
        }
    })
    return shifts
}

export function DepartmentSearch({ departmentEntries }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')

    // Get unique department names for dropdown
    const allDepartments = departmentEntries.map(d => ({
        id: d.department.id,
        name: d.department.name,
        isClinical: d.department.isClinical
    })).sort((a, b) => a.name.localeCompare(b.name))

    // Filter departments based on search and dropdown
    const filteredEntries = departmentEntries.filter((deptData) => {
        // First apply department dropdown filter
        if (selectedDepartment && deptData.department.id.toString() !== selectedDepartment) {
            return false
        }

        const query = searchQuery.toLowerCase().trim()
        if (!query) return true

        // Search by department name
        if (deptData.department.name.toLowerCase().includes(query)) return true

        // Search by specialty names
        const specialtyNames = Object.keys(deptData.specialties)
        if (specialtyNames.some(name => name.toLowerCase().includes(query))) return true

        // Search by doctor names in specialties
        for (const specName of specialtyNames) {
            const spec = deptData.specialties[specName]
            if (spec.shifts?.some((shift: any) =>
                shift.doctor?.name?.toLowerCase().includes(query)
            )) return true
        }

        return false
    })

    const clinicalDepts = filteredEntries.filter(d => d.department.isClinical !== false)
    const nonClinicalDepts = filteredEntries.filter(d => d.department.isClinical === false)

    const hasActiveFilters = searchQuery || selectedDepartment

    return (
        <>
            {/* Search and Filter Bar */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search departments, specialties, or staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Department Dropdown */}
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Departments</option>
                        <optgroup label="Clinical">
                            {allDepartments.filter(d => d.isClinical !== false).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Non-Clinical">
                            {allDepartments.filter(d => d.isClinical === false).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setSearchQuery('')
                            setSelectedDepartment('')
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Results Summary */}
            {hasActiveFilters && (
                <p className="mb-6 text-sm text-slate-500">
                    Showing {filteredEntries.length} of {departmentEntries.length} departments
                </p>
            )}

            {/* Clinical Departments Section */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <h2 className="text-lg font-bold text-slate-700">Clinical Departments</h2>
                    </div>
                    <span className="text-sm text-slate-500">
                        {clinicalDepts.length} departments
                    </span>
                </div>

                {clinicalDepts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        {searchQuery ? 'No clinical departments match your search.' : 'No clinical shifts scheduled for today.'}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {clinicalDepts.map((deptData) => (
                            <DepartmentSection
                                key={deptData.department.id}
                                department={deptData.department}
                                specialties={deptData.specialties}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Non-Clinical Departments Section - Compact Layout */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h2 className="text-lg font-bold text-slate-700">Support & Services</h2>
                    </div>
                    <span className="text-sm text-slate-500">
                        {nonClinicalDepts.length} departments
                    </span>
                </div>

                {nonClinicalDepts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        {searchQuery ? 'No support departments match your search.' : 'No support departments found.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {nonClinicalDepts.map((deptData) => {
                            const shifts = extractShifts(deptData.specialties)
                            const color = deptData.department.color || '#6B7280'
                            if (shifts.length === 0) return null

                            return (
                                <div key={deptData.department.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Department Header */}
                                    <div
                                        className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100"
                                        style={{ backgroundColor: color + '12' }}
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <h3 className="text-sm font-bold text-slate-700 truncate">
                                            {deptData.department.name}
                                        </h3>
                                    </div>

                                    {/* Rows for this department */}
                                    <div className="divide-y divide-slate-100">
                                        {shifts.map((shift: any, idx: number) => {
                                            const doctor = shift.doctor
                                            const extensions = doctor?.extension?.split(',').map((e: string) => e.trim()).filter(Boolean) || []
                                            const gsmNumbers = doctor?.gsmCccrc?.split(',').map((e: string) => e.trim()).filter(Boolean) || []
                                            const personalGsm = doctor?.gsmPersonal?.split(',').map((e: string) => e.trim()).filter(Boolean) || []

                                            return (
                                                <div
                                                    key={`${deptData.department.id}-${idx}`}
                                                    className="px-4 py-2.5 flex items-center gap-3"
                                                >
                                                    {/* Name */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-slate-800 text-sm truncate">
                                                            {doctor?.name || deptData.department.name}
                                                        </h4>
                                                    </div>

                                                    {/* Contact Numbers */}
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                                                        {extensions.map((ext: string, i: number) => (
                                                            <span
                                                                key={`ext-${i}`}
                                                                className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200"
                                                            >
                                                                <Phone size={9} />
                                                                {ext}
                                                            </span>
                                                        ))}
                                                        {gsmNumbers.map((gsm: string, i: number) => (
                                                            <span
                                                                key={`gsm-${i}`}
                                                                className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
                                                            >
                                                                <Smartphone size={9} />
                                                                {gsm}
                                                            </span>
                                                        ))}
                                                        {personalGsm.map((gsm: string, i: number) => (
                                                            <span
                                                                key={`pgsm-${i}`}
                                                                className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"
                                                            >
                                                                <Smartphone size={9} />
                                                                {gsm}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </>
    )
}
