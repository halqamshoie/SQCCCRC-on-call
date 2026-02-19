'use server'

import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { authenticateUser } from './ldap'

// Session data interface
export interface SessionData {
    username: string
    displayName: string
    role: string
    isAuthenticated: boolean
}

// Default session data
const defaultSession: SessionData = {
    username: '',
    displayName: '',
    role: '',
    isAuthenticated: false
}

// Session configuration
const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_in_production',
    cookieName: 'on-call-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
}

/**
 * Get the current session
 */
export async function getSession() {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    // Initialize session if not authenticated
    if (!session.isAuthenticated) {
        Object.assign(session, defaultSession)
    }

    return session
}

/**
 * Simple hash function for local passwords (for development only)
 * In production, use bcrypt or similar
 */
function simpleHash(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(36)
}

/**
 * Login with LDAP credentials (with local fallback)
 */
export async function login(username: string, password: string): Promise<{
    success: boolean
    error?: string
    user?: any
    method?: 'ldap' | 'local'
}> {
    try {
        // 1. First, try LDAP authentication
        const ldapResult = await authenticateUser(username, password)

        // 2. If LDAP fails due to connection error, try local fallback
        const isConnectionError = ldapResult.error?.includes('ECONNREFUSED') ||
            ldapResult.error?.includes('ETIMEDOUT') ||
            ldapResult.error?.includes('getaddrinfo') ||
            ldapResult.error?.includes('ENOTFOUND') ||
            ldapResult.error?.includes('Connection failed')

        if (!ldapResult.success && isConnectionError) {
            console.log('LDAP unreachable, trying local authentication...')

            // Check if user exists with local password
            const dbUser = await prisma.user.findUnique({
                where: { username: username }
            })

            if (dbUser && dbUser.localPassword && dbUser.isActive) {
                // Verify local password
                const hashedInput = simpleHash(password)
                if (dbUser.localPassword === hashedInput) {
                    // Local auth successful
                    const session = await getSession()
                    session.username = dbUser.username
                    session.displayName = dbUser.displayName
                    session.role = dbUser.role
                    session.isAuthenticated = true
                    await session.save()

                    console.log(`Local auth successful for: ${username}`)
                    return { success: true, user: dbUser, method: 'local' }
                }
            }

            return {
                success: false,
                error: 'LDAP server unreachable and no local password set. Please connect to SQCCCRC network or VPN.'
            }
        }

        // 3. LDAP auth failed for other reasons (wrong password, etc.)
        if (!ldapResult.success) {
            return { success: false, error: ldapResult.error || 'Authentication failed' }
        }

        // 4. LDAP success - Check if user exists in database
        let dbUser = await prisma.user.findUnique({
            where: { username: username }
        })

        // 5. If user doesn't exist in database but authenticated via LDAP, auto-create with USER role
        if (!dbUser) {
            const displayName = ldapResult.user?.displayName || username
            const email = ldapResult.user?.email || `${username}@sqcccrc.om`

            dbUser = await prisma.user.create({
                data: {
                    username: username,
                    displayName: displayName,
                    email: email,
                    role: 'USER',
                    isActive: true
                }
            })
            console.log(`Auto-registered LDAP user: ${username} with USER role`)
        }

        if (!dbUser.isActive) {
            return { success: false, error: 'User account is disabled. Please contact administrator.' }
        }

        // 6. Create session
        const session = await getSession()
        session.username = dbUser.username
        session.displayName = dbUser.displayName
        session.role = dbUser.role
        session.isAuthenticated = true
        await session.save()

        return { success: true, user: dbUser, method: 'ldap' }
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Set local password for a user (for fallback auth when LDAP unavailable)
 */
export async function setLocalPassword(username: string, password: string) {
    const hashedPassword = simpleHash(password)
    await prisma.user.update({
        where: { username },
        data: { localPassword: hashedPassword }
    })
}

/**
 * Logout and destroy session
 */
export async function logout() {
    const session = await getSession()
    session.destroy()
}

/**
 * Get currently authenticated user
 */
export async function getCurrentUser() {
    const session = await getSession()

    if (!session.isAuthenticated) {
        return null
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.username }
        })

        return user
    } catch (error) {
        console.error('Error fetching current user:', error)
        return null
    }
}
