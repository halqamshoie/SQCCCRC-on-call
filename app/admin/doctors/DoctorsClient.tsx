'use client'

import { ADUserSearch } from "@/components/admin/ADUserSearch"
import { addDoctor, deleteDoctor, updateDoctor, toggleDoctorStatus } from "@/lib/admin-actions"
import { Trash2, UserPlus, Edit2, Check, X, CheckCircle, AlertCircle, Search, Filter, Ban, Power } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

interface FormMessage {
    type: 'success' | 'error'
    text: string
}

interface ADUser {
    cn: string
    sAMAccountName: string
    mail?: string
    department?: string
    telephoneNumber?: string
}

interface DoctorsClientProps {
    doctors: any[]
    departments: any[]
    specialties: any[]
    userRole?: string
    userDepartmentId?: number | null
}

export function DoctorsClient({ doctors, departments, specialties, userRole, userDepartmentId }: DoctorsClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Determine initial department selection
    const initialDeptId = userRole === 'COORDINATOR' && userDepartmentId
        ? userDepartmentId
        : (departments[0]?.id || 0)

    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(initialDeptId)
    // For list filtering
    const [filterDepartmentId, setFilterDepartmentId] = useState<string>(userRole === 'COORDINATOR' && userDepartmentId ? userDepartmentId.toString() : "")
    const [filterSpecialtyId, setFilterSpecialtyId] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")

    // For Add Form
    const [departmentFilter, setDepartmentFilter] = useState<'all' | 'medical' | 'nonmedical'>('all')

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editFormData, setEditFormData] = useState<any>({})
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<FormMessage | null>(null)

    // Helper: Get user's department name
    const userDepartmentName = userDepartmentId
        ? departments.find(d => d.id === userDepartmentId)?.name
        : ''

    // Handle form submission with feedback
    const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setMessage(null)

        startTransition(async () => {
            const result = await addDoctor(formData)
            if (result?.success) {
                setMessage({ type: 'success', text: result.message })
                // Reset form
                const form = document.getElementById('add-doctor-form') as HTMLFormElement
                if (form) form.reset()
                // Delay refresh to allow message to display
                setTimeout(() => router.refresh(), 500)
            } else if (result?.message) {
                setMessage({ type: 'error', text: result.message })
            }
        })
    }

    const handleSelectADUser = async (user: ADUser) => {
        // Pre-fill the form with AD user data
        const form = document.getElementById('add-doctor-form') as HTMLFormElement
        if (form) {
            const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement
            const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement
            const extInput = form.querySelector('input[name="extension"]') as HTMLInputElement
            const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement

            if (nameInput) nameInput.value = user.cn
            if (emailInput && user.mail) emailInput.value = user.mail
            if (extInput && user.telephoneNumber) extInput.value = user.telephoneNumber
            if (usernameInput) usernameInput.value = user.sAMAccountName
        }
    }

    // Filter departments for form selections
    const formFilteredDepartments = departments.filter(dept => {
        if (userRole === 'COORDINATOR' && userDepartmentId) {
            return dept.id === userDepartmentId
        }

        if (departmentFilter === 'medical') return dept.isClinical
        if (departmentFilter === 'nonmedical') return !dept.isClinical
        return true
    })

    // Filter specialties for form selections
    const formFilteredSpecialties = specialties.filter(
        (spec: any) => spec.departmentId === selectedDepartmentId
    )

    // --- MAIN LIST FILTERING ---
    const filteredDoctors = doctors.filter(doc => {
        // 1. Department Filter
        if (filterDepartmentId && doc.departmentId.toString() !== filterDepartmentId) return false

        // 2. Specialty Filter
        if (filterSpecialtyId && doc.specialtyId?.toString() !== filterSpecialtyId) return false

        // 3. Search Query
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return (
                doc.name.toLowerCase().includes(q) ||
                doc.email?.toLowerCase().includes(q) ||
                doc.extension?.includes(q)
            )
        }

        return true
    })

    // Specialties for filter dropdown (based on selected dept filter)
    const filterSpecialties = filterDepartmentId
        ? specialties.filter((s: any) => s.departmentId.toString() === filterDepartmentId)
        : []


    // Start editing a staff member
    const startEdit = (doctor: any) => {
        setEditingId(doctor.id)
        setEditFormData({
            name: doctor.name,
            departmentId: doctor.departmentId,
            specialtyId: doctor.specialtyId || '',
            extension: doctor.extension || '',
            gsmPersonal: doctor.gsmPersonal || '',
            gsmCccrc: doctor.gsmCccrc || '',
            isActive: doctor.isActive
        })
    }

    // Cancel editing
    const cancelEdit = () => {
        setEditingId(null)
        setEditFormData({})
    }

    // Save edited staff member
    const saveEdit = async (id: number) => {
        setSaving(true)
        try {
            // Properly convert specialtyId to number or null
            let specialtyIdValue: number | null = null
            if (editFormData.specialtyId !== '' && editFormData.specialtyId !== null && editFormData.specialtyId !== undefined) {
                specialtyIdValue = Number(editFormData.specialtyId)
            }

            const result = await updateDoctor(id, {
                name: editFormData.name,
                departmentId: Number(editFormData.departmentId),
                specialtyId: specialtyIdValue,
                extension: editFormData.extension,
                gsmPersonal: editFormData.gsmPersonal,
                gsmCccrc: editFormData.gsmCccrc,
                isActive: editFormData.isActive
            })

            if (result?.success) {
                router.refresh()
                setEditingId(null)
                setEditFormData({})
            } else {
                alert(result?.error || 'Failed to update staff member')
            }
        } catch (error) {
            console.error('Update error:', error)
            alert(`Failed to update staff member: ${error}`)
        } finally {
            setSaving(false)
        }
    }

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        // Initial call
        let result = await toggleDoctorStatus(id, !currentStatus)

        // Handle warning (active shifts found)
        if (result.warning) {
            const confirmForce = confirm(`${result.message}\n\nDo you want to proceed anyway?`)
            if (confirmForce) {
                result = await toggleDoctorStatus(id, !currentStatus, true) // Force
            } else {
                return // Cancelled
            }
        }

        if (result.success) {
            setMessage({ type: 'success', text: result.message || 'Status updated' })
            setTimeout(() => {
                router.refresh()
                setMessage(null)
            }, 500)
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update status' })
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this staff member? This cannot be undone.')) return

        // Initial call
        let result = await deleteDoctor(id)

        // Handle warning (active shifts found)
        if (result.warning) {
            const confirmForce = confirm(`${result.message}\n\nDo you want to delete anyway?`)
            if (confirmForce) {
                result = await deleteDoctor(id, true) // Force
            } else {
                return // Cancelled
            }
        }

        if (result.success) {
            setMessage({ type: 'success', text: result.message || 'Staff member deleted' })
            setTimeout(() => {
                router.refresh()
                setMessage(null)
            }, 500)
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to delete staff member' })
        }
    }

    // Get filtered specialties for edit form
    const getEditSpecialties = (deptId: number) => {
        return specialties.filter((spec: any) => spec.departmentId === deptId)
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center justify-between">
                <span>Manage Staff</span>
                {userRole === 'COORDINATOR' && userDepartmentName && (
                    <span className="text-sm font-normal px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        Viewing: {userDepartmentName}
                    </span>
                )}
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Add Doctor Form */}
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                        {/* AD Search Integration */}
                        <ADUserSearch onSelectUser={handleSelectADUser} />

                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-blue-600" />
                            Add New Staff
                        </h3>

                        {/* Success/Error Message */}
                        {message && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {message.type === 'success'
                                    ? <CheckCircle size={18} />
                                    : <AlertCircle size={18} />
                                }
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        <form id="add-doctor-form" onSubmit={handleAddDoctor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input name="name" required className="w-full p-2 border border-slate-300 rounded-md text-slate-900" placeholder="Dr. John Doe" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Username <span className="text-slate-400">(AD login - auto-filled)</span>
                                </label>
                                <input name="username" className="w-full p-2 border border-slate-300 rounded-md text-slate-900 bg-slate-50" placeholder="e.g., m.yaqut" />
                                <p className="text-xs text-slate-500 mt-1">This will create a login account for this staff member</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input name="email" type="email" className="w-full p-2 border border-slate-300 rounded-md text-slate-900" placeholder="name@cccrc.gov.om" />
                            </div>

                            {/* Medical/Non-Medical Filter - Only show if not restricted to one department */}
                            {(!userRole || userRole === 'ADMIN' || !userDepartmentId) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department Type</label>
                                    <div className="flex gap-4 mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="deptFilter"
                                                checked={departmentFilter === 'all'}
                                                onChange={() => {
                                                    setDepartmentFilter('all')
                                                    setSelectedDepartmentId(departments[0]?.id || 0)
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm text-slate-700">All</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="deptFilter"
                                                checked={departmentFilter === 'medical'}
                                                onChange={() => {
                                                    setDepartmentFilter('medical')
                                                    const firstMedical = departments.find(d => d.isClinical)
                                                    setSelectedDepartmentId(firstMedical?.id || 0)
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm text-slate-700">Clinical</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="deptFilter"
                                                checked={departmentFilter === 'nonmedical'}
                                                onChange={() => {
                                                    setDepartmentFilter('nonmedical')
                                                    const firstNonMedical = departments.find(d => !d.isClinical)
                                                    setSelectedDepartmentId(firstNonMedical?.id || 0)
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm text-slate-700">Non-Clinical</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <select
                                    name="departmentId"
                                    className="w-full p-2 border border-slate-300 rounded-md text-slate-900"
                                    onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                                    value={selectedDepartmentId}
                                >
                                    {formFilteredDepartments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Specialty <span className="text-slate-400">(optional)</span>
                                </label>
                                <select
                                    name="specialtyId"
                                    className="w-full p-2 border border-slate-300 rounded-md text-slate-900"
                                >
                                    <option value="">No specific specialty</option>
                                    {formFilteredSpecialties.map((spec: any) => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formFilteredSpecialties.length === 0
                                        ? 'No specialties available for this department'
                                        : `${formFilteredSpecialties.length} ${formFilteredSpecialties.length === 1 ? 'specialty' : 'specialties'} available`}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Extensions <span className="text-slate-400">(comma-separated for multiple)</span>
                                </label>
                                <input name="extension" className="w-full p-2 border border-slate-300 rounded-md text-slate-900" placeholder="1234, 5678" />
                                <p className="text-xs text-slate-500 mt-1">Add multiple extensions separated by commas</p>
                            </div>



                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">GSM (Personal)</label>
                                    <input name="gsmPersonal" className="w-full p-2 border border-slate-300 rounded-md text-slate-900" placeholder="9999..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">GSM (CCCRC)</label>
                                    <input name="gsmCccrc" className="w-full p-2 border border-slate-300 rounded-md text-slate-900" placeholder="7777..." />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? 'Adding...' : 'Add To Database'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Doctors List */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        {/* Filters & Search Header */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Filter size={18} />
                                    Staff List ({filteredDoctors.length})
                                </h3>
                                {/* Search */}
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search name, email, ext..."
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Department Filter (Admin only, or restricted for Coordinator) */}
                                <div className="flex-1">
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                        value={filterDepartmentId}
                                        onChange={(e) => {
                                            setFilterDepartmentId(e.target.value)
                                            setFilterSpecialtyId("") // Reset specialty when dept changes
                                        }}
                                        disabled={userRole === 'COORDINATOR'}
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                        value={filterSpecialtyId}
                                        onChange={(e) => setFilterSpecialtyId(e.target.value)}
                                        disabled={!filterDepartmentId || filterSpecialties.length === 0}
                                    >
                                        <option value="">All Specialties</option>
                                        {filterSpecialties.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Name</th>
                                        <th className="p-4 font-semibold text-slate-600">Department</th>
                                        <th className="p-4 font-semibold text-slate-600">Specialty</th>
                                        <th className="p-4 font-semibold text-slate-600">Email</th>
                                        <th className="p-4 font-semibold text-slate-600">GSM</th>
                                        <th className="p-4 font-semibold text-slate-600">Ext</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDoctors.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500">
                                                No staff found matching your filters.
                                            </td>
                                        </tr>
                                    ) : filteredDoctors.map((doctor: any) => (
                                        editingId === doctor.id ? (
                                            <tr key={doctor.id} className="bg-blue-50">
                                                <td colSpan={7} className="p-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                                                            <input
                                                                value={editFormData.name}
                                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                                                            <select
                                                                value={editFormData.departmentId}
                                                                onChange={(e) => setEditFormData({ ...editFormData, departmentId: Number(e.target.value), specialtyId: '' })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            >
                                                                {departments.map((d: any) => (
                                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Specialty</label>
                                                            <select
                                                                value={editFormData.specialtyId}
                                                                onChange={(e) => setEditFormData({ ...editFormData, specialtyId: e.target.value })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            >
                                                                <option value="">No specific specialty</option>
                                                                {getEditSpecialties(editFormData.departmentId).map((spec: any) => (
                                                                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                                            <select
                                                                value={editFormData.isActive ? 'active' : 'inactive'}
                                                                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'active' })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">GSM (Personal)</label>
                                                            <input
                                                                value={editFormData.gsmPersonal}
                                                                onChange={(e) => setEditFormData({ ...editFormData, gsmPersonal: e.target.value })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">GSM (CCCRC)</label>
                                                            <input
                                                                value={editFormData.gsmCccrc}
                                                                onChange={(e) => setEditFormData({ ...editFormData, gsmCccrc: e.target.value })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Extension</label>
                                                            <input
                                                                value={editFormData.extension}
                                                                onChange={(e) => setEditFormData({ ...editFormData, extension: e.target.value })}
                                                                className="w-full p-2 border border-slate-300 rounded-md text-slate-900 text-sm"
                                                                placeholder="e.g. 4570"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="flex items-end gap-2 justify-end mt-2">
                                                                <button
                                                                    onClick={() => saveEdit(doctor.id)}
                                                                    disabled={saving}
                                                                    className="py-1 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                                                                >
                                                                    <Check size={16} />
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    disabled={saving}
                                                                    className="py-1 px-3 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                                                                >
                                                                    <X size={16} />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={doctor.id} className={`hover:bg-slate-50 transition-colors ${!doctor.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                                                <td className="p-4 text-slate-900 font-medium flex items-center gap-2">
                                                    {!doctor.isActive && <Ban size={14} className="text-red-500" />}
                                                    {doctor.name}
                                                </td>
                                                <td className="p-4 text-slate-500">{doctor.department.name}</td>
                                                <td className="p-4 text-slate-500 text-sm">
                                                    {doctor.specialty?.name || <span className="text-slate-400 italic">—</span>}
                                                </td>
                                                <td className="p-4 text-slate-500 text-sm truncate max-w-[120px]" title={doctor.email}>
                                                    {doctor.email ? (
                                                        <a href={`mailto:${doctor.email}`} className="text-blue-600 hover:underline">{doctor.email}</a>
                                                    ) : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="p-4 text-slate-500 font-mono text-sm">
                                                    <div className="text-xs">{doctor.gsmPersonal}</div>
                                                    <div className="text-xs text-slate-400">{doctor.gsmCccrc}</div>
                                                </td>
                                                <td className="p-4 text-slate-500 font-mono text-sm">{doctor.extension || <span className="text-slate-400">—</span>}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleToggleStatus(doctor.id, doctor.isActive)}
                                                            className={`${doctor.isActive ? 'text-green-600 hover:text-red-600' : 'text-slate-400 hover:text-green-600'} transition-colors`}
                                                            title={doctor.isActive ? "Deactivate" : "Activate"}
                                                        >
                                                            <Power size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => startEdit(doctor)}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doctor.id)}
                                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
