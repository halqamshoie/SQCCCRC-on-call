'use client'

import { toggleEmergencyCode } from "@/lib/admin-actions"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

export function CodeToggle({ code }: { code: any }) {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", code.isActive ? "bg-red-500 animate-pulse" : "bg-slate-300")} />
                <span className="font-semibold">{code.code}</span>
            </div>
            <button
                disabled={isPending}
                onClick={() => startTransition(() => toggleEmergencyCode(code.id, !code.isActive))}
                className={cn(
                    "px-3 py-1 text-xs font-bold rounded-full transition-colors",
                    code.isActive
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
            >
                {isPending ? '...' : code.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
            </button>
        </div>
    )
}
