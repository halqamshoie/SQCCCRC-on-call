/**
 * Predefined tier configurations for common hospital departments
 * Based on industry best practices for hospital on-call scheduling
 */

export interface TierPreset {
    name: string
    level: number
    responseTimeMinutes: number
}

export interface DepartmentTierPresets {
    [key: string]: TierPreset[]
}

export const tierPresets: DepartmentTierPresets = {
    medical: [
        { name: '1st Call', level: 1, responseTimeMinutes: 15 },
        { name: '2nd Call', level: 2, responseTimeMinutes: 30 },
        { name: 'Specialist', level: 3, responseTimeMinutes: 60 },
        { name: 'Consultant', level: 4, responseTimeMinutes: 120 }
    ],

    surgery: [
        { name: '1st Call Surgeon', level: 1, responseTimeMinutes: 10 },
        { name: '2nd Call Surgeon', level: 2, responseTimeMinutes: 20 },
        { name: 'Consultant Surgeon', level: 3, responseTimeMinutes: 30 }
    ],

    emergency: [
        { name: 'ER Resident', level: 1, responseTimeMinutes: 5 },
        { name: 'ER Specialist', level: 2, responseTimeMinutes: 10 },
        { name: 'ER Consultant', level: 3, responseTimeMinutes: 15 }
    ],

    labs: [
        { name: 'Technologist On Call', level: 1, responseTimeMinutes: 20 },
        { name: 'Senior Technologist', level: 2, responseTimeMinutes: 30 },
        { name: 'Lab Supervisor', level: 3, responseTimeMinutes: 45 }
    ],

    pathology: [
        { name: 'Pathology Resident', level: 1, responseTimeMinutes: 30 },
        { name: 'Pathologist', level: 2, responseTimeMinutes: 60 }
    ],

    radiology: [
        { name: 'Radiographer On Call', level: 1, responseTimeMinutes: 15 },
        { name: 'Radiology Registrar', level: 2, responseTimeMinutes: 30 },
        { name: 'Consultant Radiologist', level: 3, responseTimeMinutes: 60 }
    ],

    nursing: [
        { name: 'Nursing Supervisor', level: 1, responseTimeMinutes: 10 },
        { name: 'Clinical Coordinator', level: 2, responseTimeMinutes: 20 },
        { name: 'Director of Nursing', level: 3, responseTimeMinutes: 30 }
    ],

    pharmacy: [
        { name: 'On-Call Pharmacist', level: 1, responseTimeMinutes: 20 },
        { name: 'Senior Pharmacist', level: 2, responseTimeMinutes: 40 }
    ],

    anesthesia: [
        { name: 'Anesthesia Resident', level: 1, responseTimeMinutes: 10 },
        { name: 'Anesthesiologist', level: 2, responseTimeMinutes: 15 },
        { name: 'Senior Anesthesiologist', level: 3, responseTimeMinutes: 20 }
    ],

    cardiology: [
        { name: 'Cardiology Registrar', level: 1, responseTimeMinutes: 15 },
        { name: 'Cardiologist', level: 2, responseTimeMinutes: 20 }
    ],

    icu: [
        { name: 'ICU Resident', level: 1, responseTimeMinutes: 5 },
        { name: 'ICU Specialist', level: 2, responseTimeMinutes: 10 },
        { name: 'ICU Consultant', level: 3, responseTimeMinutes: 15 }
    ],

    // Default generic structure
    default: [
        { name: '1st On Call', level: 1, responseTimeMinutes: 20 },
        { name: '2nd On Call', level: 2, responseTimeMinutes: 40 },
        { name: 'Senior On Call', level: 3, responseTimeMinutes: 60 }
    ]
}

/**
 * Get tier presets for a department based on its code or name
 */
export function getTierPresetsForDepartment(departmentCode: string): TierPreset[] {
    const code = departmentCode.toLowerCase()
    return tierPresets[code] || tierPresets.default
}

/**
 * Get all available preset categories
 */
export function getAvailablePresets(): string[] {
    return Object.keys(tierPresets).filter(key => key !== 'default')
}
