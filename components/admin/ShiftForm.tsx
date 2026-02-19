'use client'

import { createShift } from "@/lib/admin-actions"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Types
type Department = {
    id: number;
    name: string;
    isClinical?: boolean;
    specialties: { id: number; name: string }[]
}
type Specialty = { id: number; name: string }
type Doctor = {
    id: number;
    name: string;
    departmentId: number;
    department: { id: number; name: string; isClinical?: boolean };
    specialtyId?: number | null;
    specialty?: Specialty | null;
}
type Tier = {
    id: number;
    name: string;
    specialtyId: number;
    specialty: Specialty
}
type UserContext = {
    role: string;
    departmentId?: number | null;
}

type FormMessage = {
    type: 'success' | 'error'
    text: string
}

// Standard Options for Clinical departments
const CLINICAL_TIER_OPTIONS = [
    "1st On Call",
    "2nd On Call",
    "3rd On Call / Consultant",
    "Technologist",
    "Senior Technologist",
    "Supervisor"
]

// Options for Non-Clinical departments
const NON_CLINICAL_TIER_OPTIONS = [
    "Staff On Call",
    "Supervisor"
]

// Department Type Options
type DepartmentTypeFilter = 'all' | 'clinical' | 'non-clinical'

export function ShiftForm({
    doctors,
    tiers,
    departments,
    currentUser
}: {
    doctors: Doctor[],
    tiers: Tier[],
    departments: Department[],
    currentUser: UserContext
}) {
    const router = useRouter()
    const [departmentType, setDepartmentType] = useState<DepartmentTypeFilter>('all')
    const [selectedDeptId, setSelectedDeptId] = useState<string>(
        currentUser.role === 'COORDINATOR' && currentUser.departmentId
            ? currentUser.departmentId.toString()
            : ""
    )
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [selectedTierOption, setSelectedTierOption] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<FormMessage | null>(null)

    // Filter departments by type
    const filteredDepartments = departments.filter(d => {
        if (departmentType === 'all') return true
        if (departmentType === 'clinical') return d.isClinical === true
        if (departmentType === 'non-clinical') return d.isClinical === false
        return true
    })

    // Get specialties for selected department
    const departmentSpecialties = selectedDeptId
        ? departments.find(d => d.id.toString() === selectedDeptId)?.specialties || []
        : []

    // State for specialty
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("")

    // Filter doctors by department AND specialty
    const filteredDoctors = selectedDeptId
        ? doctors.filter(d => {
            const matchesDept = d.departmentId.toString() === selectedDeptId
            const matchesSpecialty = selectedSpecialtyId
                ? d.specialtyId?.toString() === selectedSpecialtyId
                : true
            return matchesDept && matchesSpecialty
        })
        : []

    // Find the real tier ID based on selection
    const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId)

    // Find the actual DB Tier ID that matches the selected "Label"
    const resolveTierId = (tierLabel: string): number | null => {
        // If we have a selected specialty, look for tiers in that specialty matches
        const targetSpecialtyId = selectedSpecialtyId
            ? parseInt(selectedSpecialtyId)
            : selectedDoctor?.specialtyId;

        if (!targetSpecialtyId) return null;

        const relevantTiers = tiers.filter(t => t.specialtyId === targetSpecialtyId)

        // Fuzzy match the name
        const match = relevantTiers.find(t => {
            const tName = t.name.toLowerCase()
            const label = tierLabel.toLowerCase()

            if (label === "1st on call") return tName.includes("1st")
            if (label === "2nd on call") return tName.includes("2nd")
            if (label === "3rd on call / consultant") return tName.includes("3rd") || tName.includes("consultant")
            if (label === "technologist") return tName === "technologist"
            if (label === "senior technologist") return tName === "senior technologist"
            if (label === "supervisor") return tName.includes("supervisor")
            if (label === "staff on call") return tName.includes("staff") || tName.includes("1st") || tName === "on call"

            return false
        })

        return match ? match.id : null
    }

    const resolvedTierId = selectedTierOption ? resolveTierId(selectedTierOption) : null

    // Determine if this should be a fixed shift (auto-checked for non-clinical)
    const selectedDept = departments.find(d => d.id.toString() === selectedDeptId)
    const isNonClinicalDept = selectedDept?.isClinical === false

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        if (resolvedTierId) {
            formData.set('tierId', resolvedTierId.toString())
        }

        const result = await createShift(formData)
        setIsSubmitting(false)

        if (result?.success) {
            setMessage({ type: 'success', text: result.message })
            // Reset form
            setSelectedDoctorId("")
            setSelectedTierOption("")
            setTimeout(() => router.refresh(), 300)
        } else if (result?.message) {
            setMessage({ type: 'error', text: result.message })
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4"
        >
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
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        name="date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date <span className="text-slate-400">(optional)</span></label>
                    <input
                        type="date"
                        name="endDate"
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900"
                    />
                </div>
            </div>

            {/* Department Type Filter */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Type</label>
                <div className="flex gap-2">
                    {(['all', 'clinical', 'non-clinical'] as DepartmentTypeFilter[]).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                setDepartmentType(type)
                                setSelectedDeptId("") // Reset when changing type
                                setSelectedDoctorId("")
                                setSelectedTierOption("")
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${departmentType === type
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {type === 'all' ? 'All' : type === 'clinical' ? 'Clinical' : 'Non-Clinical'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Department Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select
                    name="departmentId"
                    required
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 disabled:bg-slate-100"
                    value={selectedDeptId}
                    onChange={(e) => {
                        setSelectedDeptId(e.target.value)
                        setSelectedDoctorId("") // Reset doctor when dept changes
                        setSelectedTierOption("")
                    }}
                    disabled={currentUser.role === 'COORDINATOR'}
                >
                    <option value="">Select Department...</option>
                    {filteredDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Specialty Selection */}
            {selectedDeptId && departmentSpecialties.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                    <select
                        name="specialtyId"
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900"
                        value={selectedSpecialtyId}
                        onChange={(e) => {
                            setSelectedSpecialtyId(e.target.value)
                            setSelectedDoctorId("") // Reset doctor on specialty change
                            setSelectedTierOption("")
                        }}
                    >
                        <option value="">All Specialties</option>
                        {departmentSpecialties.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Doctor/Staff Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isNonClinicalDept ? 'Staff' : 'Doctor'}
                </label>
                <select
                    name="doctorId"
                    required
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={!selectedDeptId}
                >
                    <option value="">{isNonClinicalDept ? 'Select Staff...' : 'Select Doctor...'}</option>
                    {filteredDoctors.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.name} {d.specialty ? `(${d.specialty.name})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tier Selection - Mapped */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Tier</label>
                <select
                    name="tierOption" // Not the real field, we inject tierId manually
                    required
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedTierOption}
                    onChange={(e) => setSelectedTierOption(e.target.value)}
                    disabled={!selectedDoctorId}
                >
                    <option value="">Select Role...</option>
                    {(isNonClinicalDept ? NON_CLINICAL_TIER_OPTIONS : CLINICAL_TIER_OPTIONS).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {/* Visual feedback if we found a match */}
                {selectedDoctorId && selectedTierOption && !resolvedTierId && (
                    <p className="text-xs text-red-500 mt-1">
                        ⚠️ No configuration found for this role in {selectedDoctor?.specialty?.name || 'this department'}.
                    </p>
                )}
            </div>

            {/* Hidden Input for resolved ID */}
            <input type="hidden" name="tierId" value={resolvedTierId || ''} />

            {/* Fixed On-Call Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                    type="checkbox"
                    name="isFixed"
                    id="isFixed"
                    defaultChecked={isNonClinicalDept}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isFixed" className="text-sm text-slate-700">
                    <span className="font-medium">Fixed On-Call</span>
                    <span className="text-slate-500 ml-1">(Permanent assignment, does not rotate)</span>
                </label>
            </div>

            <button
                type="submit"
                disabled={!resolvedTierId || isSubmitting}
                className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Assign Shift'}
            </button>
        </form>
    )
}
