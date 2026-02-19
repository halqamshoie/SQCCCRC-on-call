import { Phone } from "lucide-react"

interface EmergencyCodeProps {
    codes: { id: number; code: string; extension?: string | null; color: string; description: string | null }[]
}

export function CodeStatus({ codes }: EmergencyCodeProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 mb-8 border border-slate-200 rounded-lg overflow-hidden">
            {codes.map((code) => (
                <div
                    key={code.id}
                    className="flex flex-col text-white"
                    style={{ backgroundColor: code.color }}
                >
                    {/* Header with code name */}
                    <div
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    >
                        {code.code}
                    </div>
                    {/* Extension number */}
                    <div className="px-4 py-3 flex items-center gap-2">
                        <Phone size={16} className="opacity-80" />
                        <span className="text-2xl font-bold font-mono">
                            {code.extension || "N/A"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}
