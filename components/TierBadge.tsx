import { cn, getTierBadgeColor } from '@/lib/utils'

interface TierBadgeProps {
    name: string
    level: number
    className?: string
}

export function TierBadge({ name, level, className }: TierBadgeProps) {
    return (
        <span className={cn(
            'inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
            getTierBadgeColor(level),
            className
        )}>
            {name}
        </span>
    )
}
