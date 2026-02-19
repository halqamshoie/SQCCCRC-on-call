import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Format tier name for display
 */
export function formatTierName(tierName: string): string {
    return tierName
}

/**
 * Get department color (returns Tailwind-safe color string)
 */
export function getDepartmentColor(color?: string): string {
    return color || '#3B82F6'
}

/**
 * Get tier badge color based on level
 */
export function getTierBadgeColor(level: number): string {
    const colors = [
        'bg-blue-100 text-blue-800',      // Level 1
        'bg-purple-100 text-purple-800',  // Level 2
        'bg-emerald-100 text-emerald-800', // Level 3
        'bg-amber-100 text-amber-800',    // Level 4
        'bg-rose-100 text-rose-800',      // Level 5+
    ]
    return colors[Math.min(level - 1, colors.length - 1)] || colors[0]
}

/**
 * Format time string for display
 */
export function formatTime(time?: string): string {
    if (!time) return ''
    // Time is already in HH:MM format
    return time
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date)
}

