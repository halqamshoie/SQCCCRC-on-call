import { Phone, User, Building2, Clock, AlertCircle, ArrowRight } from "lucide-react"
import { TierBadge } from "./TierBadge"
import { formatTime } from "@/lib/utils"

interface OnCallCardProps {
    shift: any
}

export function OnCallCard({ shift }: OnCallCardProps) {
    const { doctor, tier, specialty, startTime, endTime, isBackup, notes } = shift
    const departmentColor = doctor.department.color || '#3B82F6'

    return (
        <div
            className="glass-card p-4 sm:p-6 flex flex-col h-full border-l-4"
            style={{ borderLeftColor: departmentColor }}
        >
            {/* Tier Badge */}
            <div className="mb-4 flex items-center justify-between">
                <TierBadge name={tier.name} level={tier.level} />
                {isBackup && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Backup
                    </span>
                )}
            </div>

            {/* Doctor Info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <User size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800">{doctor.name}</h3>
                    {doctor.jobTitle && (
                        <p className="text-sm text-slate-600 mt-0.5">{doctor.jobTitle}</p>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Building2 size={14} />
                        <span>{doctor.department.name}</span>
                    </div>
                    {/* Highlighted Specialty Badge */}
                    {(specialty || shift.specialtyName) && (
                        <div className="mt-2">
                            <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200"
                            >
                                {specialty?.name || shift.specialtyName}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Shift Time */}
            {(startTime || endTime) && (
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} />
                    <span>
                        {formatTime(startTime) || '00:00'} - {formatTime(endTime) || '23:59'}
                    </span>
                </div>
            )}

            {/* Notes */}
            {notes && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-slate-700 flex items-start gap-2">
                    <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{notes}</span>
                </div>
            )}

            {/* Escalation Info */}
            {tier.escalationTier && (
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <ArrowRight size={14} />
                    <span>Escalates to: <strong>{tier.escalationTier.name}</strong></span>
                </div>
            )}

            {/* Contact Info */}
            <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                {/* Extensions - show as pills if multiple */}
                <div>
                    <span className="text-slate-400 text-xs uppercase font-medium block mb-2">
                        {doctor.extension?.includes(',') ? 'Extensions' : 'Extension'}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Phone size={18} className="text-emerald-500" />
                        {doctor.extension ? (
                            doctor.extension.split(',').map((ext: string, i: number) => (
                                <span
                                    key={i}
                                    className="font-mono font-bold text-slate-700 bg-emerald-50 px-2 py-1 rounded text-sm border border-emerald-200"
                                >
                                    {ext.trim()}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-400">N/A</span>
                        )}
                    </div>
                </div>

                {/* GSM Numbers */}
                {(doctor.gsmPersonal || doctor.gsmCccrc) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {doctor.gsmCccrc && (
                            <span>CCCRC: <strong className="font-mono">{doctor.gsmCccrc}</strong></span>
                        )}
                        {doctor.gsmPersonal && (
                            <span>Personal: <strong className="font-mono">{doctor.gsmPersonal}</strong></span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

