import React, { useState, useCallback } from 'react'
import {
    View, Text, ScrollView, RefreshControl, StyleSheet,
    TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shared } from '../theme'
import { getSwapRequests, createSwapRequest, getMyShifts } from '../services/api'

type SwapRequest = {
    id: number
    status: string
    reason: string | null
    adminNotes: string | null
    createdAt: string
    isRequester: boolean
    requester: { name: string; department: string }
    target: { name: string; department: string } | null
    requesterShift: { date: string; tier: string; specialty: string | null }
    targetShift: { date: string; tier: string; specialty: string | null } | null
}

type Shift = {
    id: number
    date: string
    tier: string
    department: string
}

export default function SwapScreen() {
    const [requests, setRequests] = useState<SwapRequest[]>([])
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [myShifts, setMyShifts] = useState<Shift[]>([])
    const [selectedShift, setSelectedShift] = useState<number | null>(null)
    const [reason, setReason] = useState('')
    const [creating, setCreating] = useState(false)

    async function fetchData() {
        try {
            const result = await getSwapRequests()
            setRequests(result.requests || [])
        } catch (error) {
            console.error('Failed to fetch swaps:', error)
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

    async function openCreate() {
        try {
            const result = await getMyShifts()
            setMyShifts(result.upcoming || [])
            setShowCreate(true)
        } catch (error) {
            Alert.alert('Error', 'Failed to load your shifts')
        }
    }

    async function handleCreate() {
        if (!selectedShift) {
            Alert.alert('Error', 'Please select a shift')
            return
        }
        setCreating(true)
        try {
            await createSwapRequest(selectedShift, reason || undefined)
            Alert.alert('Success', 'Swap request submitted')
            setShowCreate(false)
            setSelectedShift(null)
            setReason('')
            await fetchData()
        } catch (error: any) {
            Alert.alert('Error', error.message)
        } finally {
            setCreating(false)
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'PENDING': return { bg: colors.warningBg, text: colors.warning }
            case 'APPROVED': return { bg: colors.successBg, text: colors.success }
            case 'REJECTED': return { bg: colors.dangerBg, text: colors.danger }
            case 'CANCELLED': return { bg: colors.primary, text: colors.textMuted }
            default: return { bg: colors.infoBg, text: colors.info }
        }
    }

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime()
        const hours = Math.floor(diff / 3600000)
        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        if (days === 1) return 'Yesterday'
        return `${days}d ago`
    }

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
                <View style={[shared.row, { justifyContent: 'space-between' }]}>
                    <View>
                        <Text style={shared.headerTitle}>Swap Requests</Text>
                        <Text style={shared.headerSubtitle}>{requests.length} total requests</Text>
                    </View>
                    <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                        <Ionicons name="add" size={20} color={colors.white} />
                        <Text style={styles.createBtnText}>New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={shared.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {requests.length === 0 ? (
                    <View style={shared.emptyState}>
                        <Ionicons name="swap-horizontal" size={48} color={colors.textMuted} />
                        <Text style={shared.emptyText}>No swap requests yet</Text>
                        <TouchableOpacity style={[styles.createBtn, { marginTop: 16 }]} onPress={openCreate}>
                            <Text style={styles.createBtnText}>Create your first request</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    requests.map((req) => {
                        const statusColor = getStatusColor(req.status)
                        return (
                            <View key={req.id} style={shared.card}>
                                <View style={shared.cardHeader}>
                                    <View style={[shared.badge, { backgroundColor: statusColor.bg }]}>
                                        <Text style={[shared.badgeText, { color: statusColor.text }]}>
                                            {req.status}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }} />
                                    <Text style={styles.timeAgo}>{timeAgo(req.createdAt)}</Text>
                                </View>

                                <View style={shared.cardContent}>
                                    {/* From */}
                                    <View style={styles.swapRow}>
                                        <Ionicons name="arrow-up-circle" size={18} color={colors.info} />
                                        <View style={styles.swapInfo}>
                                            <Text style={styles.swapName}>{req.requester.name}</Text>
                                            <Text style={styles.swapDetail}>
                                                {req.requesterShift.date} · {req.requesterShift.tier}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Swap Arrow */}
                                    <View style={styles.swapArrow}>
                                        <Ionicons name="swap-vertical" size={16} color={colors.textMuted} />
                                    </View>

                                    {/* To */}
                                    <View style={styles.swapRow}>
                                        <Ionicons name="arrow-down-circle" size={18} color={colors.success} />
                                        <View style={styles.swapInfo}>
                                            <Text style={styles.swapName}>
                                                {req.target?.name || 'Open Request'}
                                            </Text>
                                            {req.targetShift && (
                                                <Text style={styles.swapDetail}>
                                                    {req.targetShift.date} · {req.targetShift.tier}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Reason & Notes */}
                                    {req.reason && (
                                        <View style={styles.noteBox}>
                                            <Text style={styles.noteLabel}>Reason:</Text>
                                            <Text style={styles.noteText}>{req.reason}</Text>
                                        </View>
                                    )}
                                    {req.adminNotes && (
                                        <View style={[styles.noteBox, { borderColor: colors.accent }]}>
                                            <Text style={[styles.noteLabel, { color: colors.accent }]}>Admin Notes:</Text>
                                            <Text style={styles.noteText}>{req.adminNotes}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )
                    })
                )}
            </ScrollView>

            {/* Create Swap Modal */}
            <Modal visible={showCreate} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Swap Request</Text>
                            <TouchableOpacity onPress={() => setShowCreate(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>Select your shift:</Text>
                            {myShifts.length === 0 ? (
                                <Text style={styles.noShifts}>No upcoming shifts found</Text>
                            ) : (
                                myShifts.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[
                                            styles.shiftOption,
                                            selectedShift === s.id && styles.shiftOptionSelected
                                        ]}
                                        onPress={() => setSelectedShift(s.id)}
                                    >
                                        <Ionicons
                                            name={selectedShift === s.id ? 'radio-button-on' : 'radio-button-off'}
                                            size={20}
                                            color={selectedShift === s.id ? colors.accent : colors.textMuted}
                                        />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={styles.shiftOptionDate}>
                                                {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </Text>
                                            <Text style={styles.shiftOptionTier}>{s.tier} · {s.department}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}

                            <Text style={[styles.label, { marginTop: 20 }]}>Reason (optional):</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={3}
                                placeholder="Why do you need to swap?"
                                placeholderTextColor={colors.textMuted}
                                value={reason}
                                onChangeText={setReason}
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                            onPress={handleCreate}
                            disabled={creating}
                        >
                            {creating ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    createBtnText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    timeAgo: {
        fontSize: 11,
        color: colors.textMuted,
    },
    swapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    swapInfo: {
        flex: 1,
    },
    swapName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    swapDetail: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    swapArrow: {
        alignItems: 'center',
        paddingVertical: 4,
        marginLeft: 1,
    },
    noteBox: {
        borderLeftWidth: 2,
        borderColor: colors.cardBorder,
        paddingLeft: 10,
        marginTop: 12,
    },
    noteLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    noteText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    noShifts: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    shiftOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: 8,
    },
    shiftOptionSelected: {
        borderColor: colors.accent,
        backgroundColor: colors.accent + '11',
    },
    shiftOptionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    shiftOptionTier: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    textArea: {
        backgroundColor: colors.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 14,
        fontSize: 14,
        color: colors.text,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: colors.accent,
        marginHorizontal: 20,
        marginBottom: 32,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
})
