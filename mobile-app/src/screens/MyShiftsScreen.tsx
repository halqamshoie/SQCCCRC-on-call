import React, { useState, useCallback } from 'react'
import {
    View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shared } from '../theme'
import { getMyShifts } from '../services/api'

type Shift = {
    id: number
    date: string
    endDate: string | null
    tier: string
    tierLevel: number
    specialty: string | null
    department: string
    departmentColor: string
    isBackup: boolean
    notes: string | null
}

export default function MyShiftsScreen() {
    const [upcoming, setUpcoming] = useState<Shift[]>([])
    const [past, setPast] = useState<Shift[]>([])
    const [staffName, setStaffName] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

    async function fetchData() {
        try {
            const result = await getMyShifts()
            setUpcoming(result.upcoming || [])
            setPast(result.past || [])
            setStaffName(result.staffName || '')
        } catch (error) {
            console.error('Failed to fetch shifts:', error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            fetchData().finally(() => setLoading(false))
        }, [])
    )

    async function onRefresh() {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
    }

    function formatDate(dateStr: string) {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    }

    function getDaysUntil(dateStr: string) {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const target = new Date(dateStr)
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 0) return 'Today'
        if (diff === 1) return 'Tomorrow'
        return `In ${diff} days`
    }

    function getDaysAgo(dateStr: string) {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const target = new Date(dateStr)
        const diff = Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 0) return 'Today'
        if (diff === 1) return 'Yesterday'
        return `${diff} days ago`
    }

    const shifts = activeTab === 'upcoming' ? upcoming : past

    if (loading) {
        return (
            <View style={[shared.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        )
    }

    return (
        <View style={shared.container}>
            <View style={shared.header}>
                <Text style={shared.headerTitle}>My Shifts</Text>
                {staffName && <Text style={shared.headerSubtitle}>{staffName}</Text>}

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TabButton
                        active={activeTab === 'upcoming'}
                        label={`Upcoming (${upcoming.length})`}
                        onPress={() => setActiveTab('upcoming')}
                    />
                    <TabButton
                        active={activeTab === 'past'}
                        label={`Past (${past.length})`}
                        onPress={() => setActiveTab('past')}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={shared.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {shifts.length === 0 ? (
                    <View style={shared.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                        <Text style={shared.emptyText}>
                            {activeTab === 'upcoming' ? 'No upcoming shifts' : 'No past shifts'}
                        </Text>
                    </View>
                ) : (
                    shifts.map((shift, i) => (
                        <View key={shift.id} style={shared.card}>
                            <View style={styles.shiftCard}>
                                {/* Date Column */}
                                <View style={[styles.dateCol, { borderLeftWidth: 4, borderLeftColor: shift.departmentColor }]}>
                                    <Text style={styles.dateDay}>
                                        {new Date(shift.date).getDate()}
                                    </Text>
                                    <Text style={styles.dateMonth}>
                                        {new Date(shift.date).toLocaleDateString('en-GB', { month: 'short' })}
                                    </Text>
                                    <Text style={styles.dateWeekday}>
                                        {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                                    </Text>
                                </View>

                                {/* Details */}
                                <View style={styles.shiftDetails}>
                                    <Text style={styles.shiftTier}>{shift.tier}</Text>
                                    <View style={shared.row}>
                                        <View style={[styles.deptDot, { backgroundColor: shift.departmentColor }]} />
                                        <Text style={styles.shiftDept}>{shift.department}</Text>
                                    </View>
                                    {shift.specialty && (
                                        <Text style={styles.shiftSpecialty}>{shift.specialty}</Text>
                                    )}
                                    {shift.notes && (
                                        <Text style={styles.shiftNotes} numberOfLines={2}>{shift.notes}</Text>
                                    )}
                                </View>

                                {/* Countdown */}
                                <View style={styles.countdown}>
                                    <Text style={[styles.countdownText, {
                                        color: activeTab === 'upcoming'
                                            ? (getDaysUntil(shift.date) === 'Today' ? colors.success : colors.accent)
                                            : colors.textMuted
                                    }]}>
                                        {activeTab === 'upcoming' ? getDaysUntil(shift.date) : getDaysAgo(shift.date)}
                                    </Text>
                                    {shift.isBackup && (
                                        <View style={[shared.badge, { backgroundColor: colors.warningBg, marginTop: 4 }]}>
                                            <Text style={[shared.badgeText, { color: colors.warning }]}>Backup</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    )
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
    return (
        <View style={[styles.tab, active && styles.tabActive]}>
            <Text
                style={[styles.tabText, active && styles.tabTextActive]}
                onPress={onPress}
            >
                {label}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    tabs: {
        flexDirection: 'row',
        marginTop: 16,
        backgroundColor: colors.primaryLight,
        borderRadius: 10,
        padding: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: colors.accent,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabTextActive: {
        color: colors.white,
    },
    shiftCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateCol: {
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRightWidth: 1,
        borderRightColor: colors.cardBorder,
    },
    dateDay: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    dateMonth: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.accent,
        textTransform: 'uppercase',
    },
    dateWeekday: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2,
    },
    shiftDetails: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    shiftTier: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    deptDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    shiftDept: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    shiftSpecialty: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    shiftNotes: {
        fontSize: 11,
        color: colors.textMuted,
        fontStyle: 'italic',
        marginTop: 4,
    },
    countdown: {
        alignItems: 'flex-end',
        paddingRight: 14,
    },
    countdownText: {
        fontSize: 11,
        fontWeight: '700',
    },
})
