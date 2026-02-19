import { StyleSheet } from 'react-native'

export const colors = {
    primary: '#1e293b',       // slate-800
    primaryLight: '#334155',  // slate-700
    accent: '#4f46e5',        // indigo-600
    accentLight: '#6366f1',   // indigo-500
    background: '#0f172a',    // slate-900
    card: '#1e293b',          // slate-800
    cardBorder: '#334155',    // slate-700
    text: '#f8fafc',          // slate-50
    textSecondary: '#94a3b8', // slate-400
    textMuted: '#64748b',     // slate-500
    success: '#22c55e',       // green-500
    successBg: '#052e16',     // green-950
    warning: '#f59e0b',       // amber-500
    warningBg: '#451a03',     // amber-950
    danger: '#ef4444',        // red-500
    dangerBg: '#450a0a',      // red-950
    info: '#3b82f6',          // blue-500
    infoBg: '#172554',        // blue-950
    white: '#ffffff',
    border: '#334155',
}

export const shared = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: colors.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    cardContent: {
        padding: 16,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
    },
    emptyState: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        color: colors.textMuted,
        marginTop: 12,
    },
})
