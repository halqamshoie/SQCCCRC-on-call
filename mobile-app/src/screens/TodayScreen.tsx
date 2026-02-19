import React, { useState, useCallback } from 'react'
import {
    View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, ActionSheetIOS, Platform, Alert, Modal, FlatList
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shared } from '../theme'
import { getSchedule } from '../services/api'

type StaffMember = {
    id: number
    name: string
    tier: string
    tierLevel: number
    specialty: string | null
    phone: string | null
    isBackup: boolean
}

type Department = {
    department: string
    color: string
    isClinical: boolean
    staff: StaffMember[]
}

export default function TodayScreen() {
    const [data, setData] = useState<{ departments: Department[], totalStaff: number, date: string } | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // Filtering State
    const [filterType, setFilterType] = useState<'all' | 'clinical' | 'non-clinical'>('all')
    const [selectedDept, setSelectedDept] = useState<string | null>(null)
    const [deptModalVisible, setDeptModalVisible] = useState(false)

    async function fetchData(date?: string) {
        try {
            const result = await getSchedule(date || undefined)
            setData(result)
        } catch (error) {
            console.error('Failed to fetch schedule:', error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            fetchData(selectedDate || undefined).finally(() => setLoading(false))
        }, [selectedDate])
    )

    async function onRefresh() {
        setRefreshing(true)
        await fetchData(selectedDate || undefined)
        setRefreshing(false)
    }

    function navigateDate(direction: number) {
        const current = selectedDate ? new Date(selectedDate) : new Date()
        current.setDate(current.getDate() + direction)
        setSelectedDate(current.toISOString().split('T')[0])
    }

    const displayDate = selectedDate || new Date().toISOString().split('T')[0]
    const dateObj = new Date(displayDate)
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
    })

    const isToday = !selectedDate || selectedDate === new Date().toISOString().split('T')[0]

    if (loading) {
        return (
            <View style={[shared.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        )
    }

    return (
        <View style={shared.container}>
            {/* Header */}
            <View style={shared.header}>
                <Text style={shared.headerTitle}>
                    {isToday ? "Today's On-Call" : 'On-Call Schedule'}
                </Text>

                {/* Date Navigation */}
                <View style={styles.dateNav}>
                    <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateBtn}>
                        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSelectedDate(null)}
                        style={styles.dateLabelArea}
                    >
                        <Text style={[styles.dateLabel, isToday && styles.dateLabelToday]}>
                            {formattedDate}
                        </Text>
                        {!isToday && <Text style={styles.todayLink}>tap for today</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigateDate(1)} style={styles.dateBtn}>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Summary */}
                <View style={styles.summary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{data?.totalStaff || 0}</Text>
                        <Text style={styles.summaryLabel}>Total Staff</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{data?.departments?.length || 0}</Text>
                        <Text style={styles.summaryLabel}>Departments</Text>
                    </View>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                    <TouchableOpacity
                        onPress={() => setFilterType('all')}
                        style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('clinical')}
                        style={[styles.filterChip, filterType === 'clinical' && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterText, filterType === 'clinical' && styles.filterTextActive]}>Clinical</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('non-clinical')}
                        style={[styles.filterChip, filterType === 'non-clinical' && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterText, filterType === 'non-clinical' && styles.filterTextActive]}>Non-Clinical</Text>
                    </TouchableOpacity>

                    <View style={styles.verticalDivider} />

                    <TouchableOpacity
                        onPress={() => setDeptModalVisible(true)}
                        style={[styles.filterChip, selectedDept !== null && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterText, selectedDept !== null && styles.filterTextActive]}>
                            {selectedDept || 'Department ▾'}
                        </Text>
                    </TouchableOpacity>
                    {selectedDept && (
                        <TouchableOpacity onPress={() => setSelectedDept(null)} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={shared.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {(() => {
                    let filtered = data?.departments || []

                    if (filterType === 'clinical') {
                        filtered = filtered.filter(d => d.isClinical)
                    } else if (filterType === 'non-clinical') {
                        filtered = filtered.filter(d => !d.isClinical)
                    }

                    if (selectedDept) {
                        filtered = filtered.filter(d => d.department === selectedDept)
                    }

                    if (filtered.length === 0) {
                        return (
                            <View style={shared.emptyState}>
                                <Ionicons name="filter" size={48} color={colors.textMuted} />
                                <Text style={shared.emptyText}>No departments match your filters</Text>
                            </View>
                        )
                    }

                    return filtered.map((dept, i) => (
                        <View key={i} style={shared.card}>
                            {/* Department Header */}
                            <View style={[shared.cardHeader, { borderLeftWidth: 4, borderLeftColor: dept.color }]}>
                                <View style={[styles.deptDot, { backgroundColor: dept.color }]} />
                                <Text style={styles.deptName}>{dept.department}</Text>
                                <View style={[shared.badge, { backgroundColor: dept.color + '22' }]}>
                                    <Text style={[shared.badgeText, { color: dept.color }]}>
                                        {dept.staff.length}
                                    </Text>
                                </View>
                            </View>

                            {/* Staff List */}
                            {dept.staff.map((s, j) => (
                                <View key={j} style={[styles.staffRow, j > 0 && { borderTopWidth: 1, borderTopColor: colors.cardBorder }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.staffName}>{s.name}</Text>
                                        <View style={shared.row}>
                                            <View style={[shared.badge, { backgroundColor: colors.infoBg, marginRight: 6 }]}>
                                                <Text style={[shared.badgeText, { color: colors.info }]}>{s.tier}</Text>
                                            </View>
                                            {s.specialty && (
                                                <Text style={styles.specialty}>{s.specialty}</Text>
                                            )}
                                        </View>
                                        {s.phone && (
                                            <Text style={styles.phoneText}>
                                                <Ionicons name="call-outline" size={12} color={colors.textSecondary} /> {s.phone}
                                            </Text>
                                        )}
                                    </View>
                                    {s.phone && (
                                        <TouchableOpacity
                                            style={styles.phoneBtn}
                                            onPress={() => {
                                                if (!s.phone) return
                                                const numbers = s.phone.split(',').map(n => n.trim()).filter(Boolean)

                                                if (numbers.length === 1) {
                                                    Linking.openURL(`tel:${numbers[0].replace(/\s+/g, '')}`)
                                                    return
                                                }

                                                if (Platform.OS === 'ios') {
                                                    ActionSheetIOS.showActionSheetWithOptions(
                                                        {
                                                            options: [...numbers, 'Cancel'],
                                                            cancelButtonIndex: numbers.length,
                                                            title: 'Select Number to Call'
                                                        },
                                                        (buttonIndex) => {
                                                            if (buttonIndex < numbers.length) {
                                                                Linking.openURL(`tel:${numbers[buttonIndex].replace(/\s+/g, '')}`)
                                                            }
                                                        }
                                                    )
                                                } else {
                                                    Alert.alert(
                                                        'Select Number',
                                                        undefined,
                                                        [
                                                            ...numbers.slice(0, 3).map(n => ({
                                                                text: n,
                                                                onPress: () => Linking.openURL(`tel:${n.replace(/\s+/g, '')}`)
                                                            })),
                                                            { text: 'Cancel', style: 'cancel' }
                                                        ]
                                                    )
                                                }
                                            }}
                                        >
                                            <Ionicons name="call" size={16} color={colors.success} />
                                        </TouchableOpacity>
                                    )}
                                    {s.isBackup && (
                                        <View style={[shared.badge, { backgroundColor: colors.warningBg }]}>
                                            <Text style={[shared.badgeText, { color: colors.warning }]}>Backup</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    ))
                })()}
            </ScrollView>

            <Modal visible={deptModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Department</Text>
                            <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={data?.departments.map(d => d.department).sort().filter((v, i, a) => a.indexOf(v) === i)}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedDept(item)
                                        setDeptModalVisible(false)
                                    }}
                                >
                                    <Text style={[styles.modalItemText, selectedDept === item && { color: colors.accent }]}>
                                        {item}
                                    </Text>
                                    {selectedDept === item && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 12,
    },
    dateBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.primaryLight,
    },
    dateLabelArea: {
        alignItems: 'center',
    },
    dateLabel: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    dateLabelToday: {
        color: colors.accent,
    },
    todayLink: {
        color: colors.accentLight,
        fontSize: 10,
        marginTop: 2,
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 24,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    summaryLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.cardBorder,
    },
    deptDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    deptName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    staffName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    specialty: {
        fontSize: 11,
        color: colors.textMuted,
    },
    phoneText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    phoneBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    filtersContainer: {
        marginTop: 16,
        marginBottom: 8,
        height: 40,
    },
    filtersScroll: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    filterChipActive: {
        backgroundColor: colors.accent + '20',
        borderColor: colors.accent,
    },
    filterText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
        marginTop: -1,
    },
    filterTextActive: {
        color: colors.accent,
    },
    verticalDivider: {
        width: 1,
        height: 20,
        backgroundColor: colors.cardBorder,
        marginHorizontal: 4,
    },
    clearBtn: {
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalItemText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
})
