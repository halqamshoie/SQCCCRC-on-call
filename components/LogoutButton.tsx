'use client'

import { logoutAction } from "@/lib/auth-actions"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
    className?: string
    variant?: 'sidebar' | 'header'
}

export function LogoutButton({ className, variant = 'sidebar' }: LogoutButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleLogout() {
        setLoading(true)
        try {
            await logoutAction()
        } catch (error) {
            console.error('Logout error:', error)
            setLoading(false)
        }
    }

    if (variant === 'header') {
        return (
            <button
                onClick={handleLogout}
                disabled={loading}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50",
                    className
                )}
            >
                <LogOut size={16} />
                <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
        )
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={cn(
                "flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50 w-full",
                className
            )}
        >
            <LogOut size={16} />
            <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
        </button>
    )
}
