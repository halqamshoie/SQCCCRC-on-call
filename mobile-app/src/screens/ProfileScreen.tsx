import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shared } from '../theme'
import { useAuth } from '../contexts/AuthContext'

export default function ProfileScreen() {
    const { user, logout } = useAuth()

    function handleLogout() {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
            ]
        )
    }

    function getRoleInfo(role: string) {
        switch (role) {
            case 'ADMIN': return { label: 'Administrator', color: colors.danger, icon: 'shield' as const }
            case 'COORDINATOR': return { label: 'Coordinator', color: colors.warning, icon: 'people' as const }
            default: return { label: 'Staff', color: colors.info, icon: 'person' as const }
        }
    }

    const roleInfo = getRoleInfo(user?.role || 'USER')

    return (
        <View style={shared.container}>
            <View style={shared.header}>
                <Text style={shared.headerTitle}>Profile</Text>
            </View>

            <View style={styles.content}>
                {/* Profile Card */}
                <View style={shared.card}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.displayName}>{user?.displayName}</Text>
                        <Text style={styles.username}>@{user?.username}</Text>
                        <View style={[shared.badge, { backgroundColor: roleInfo.color + '22', marginTop: 8 }]}>
                            <Text style={[shared.badgeText, { color: roleInfo.color }]}>
                                {roleInfo.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info Card */}
                <View style={shared.card}>
                    <View style={shared.cardContent}>
                        <InfoRow icon="person-outline" label="Full Name" value={user?.displayName || ''} />
                        <View style={shared.divider} />
                        <InfoRow icon="at" label="Username" value={user?.username || ''} />
                        <View style={shared.divider} />
                        <InfoRow icon="business-outline" label="Department" value={user?.department || 'Not assigned'} />
                        <View style={shared.divider} />
                        <InfoRow icon="shield-checkmark-outline" label="Role" value={roleInfo.label} />
                    </View>
                </View>

                {/* App Info */}
                <View style={shared.card}>
                    <View style={shared.cardContent}>
                        <InfoRow icon="information-circle-outline" label="App Version" value="1.0.0" />
                        <View style={shared.divider} />
                        <InfoRow icon="server-outline" label="Server" value="SQCCCRC On-Call" />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon as any} size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.white,
    },
    displayName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    username: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    infoLabel: {
        fontSize: 13,
        color: colors.textMuted,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.dangerBg,
        padding: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.danger,
    },
})
