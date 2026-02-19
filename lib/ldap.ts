'use server'

import { Client } from 'ldapts'

// LDAP Configuration from user
const LDAP_CONFIG = {
    url: 'ldap://172.30.0.2',
    baseDN: 'OU=Departments,DC=sqccc,DC=edu,DC=local',
    domain: 'sqccc.edu.local',
    // Service account for binding
    serviceAccount: 'odoo@sqccc.edu.local',
    servicePassword: 'erp@dmin23',
}

export interface ADUser {
    dn: string
    cn: string
    sAMAccountName: string
    mail?: string
    department?: string
    telephoneNumber?: string
}

export async function searchADUsers(searchTerm: string): Promise<ADUser[]> {
    const client = new Client({
        url: LDAP_CONFIG.url,
        timeout: 10000,
        connectTimeout: 10000,
    })

    try {
        // Bind with service account
        await client.bind(LDAP_CONFIG.serviceAccount, LDAP_CONFIG.servicePassword)

        // Build filter
        const searchFilter = searchTerm
            ? `(&(objectClass=user)(objectCategory=person)(|(cn=*${searchTerm}*)(sAMAccountName=*${searchTerm}*)(displayName=*${searchTerm}*)))`
            : `(&(objectClass=user)(objectCategory=person))`

        const { searchEntries } = await client.search(LDAP_CONFIG.baseDN, {
            scope: 'sub',
            filter: searchFilter,
            attributes: ['cn', 'sAMAccountName', 'mail', 'department', 'telephoneNumber', 'displayName', 'distinguishedName'],
            sizeLimit: 100,
        })

        const users: ADUser[] = searchEntries.map((entry) => ({
            dn: String(entry.distinguishedName || entry.dn || ''),
            cn: String(entry.displayName || entry.cn || ''),
            sAMAccountName: String(entry.sAMAccountName || ''),
            mail: entry.mail ? String(entry.mail) : undefined,
            department: entry.department ? String(entry.department) : undefined,
            telephoneNumber: entry.telephoneNumber ? String(entry.telephoneNumber) : undefined,
        })).filter(u => u.cn) // Only return users with names

        return users
    } catch (error) {
        console.error('LDAP Error:', error)
        return []
    } finally {
        await client.unbind()
    }
}

export async function getAllADUsers(): Promise<ADUser[]> {
    return searchADUsers('')
}

/**
 * Authenticate a user against Active Directory
 * @param username - LDAP username (sAMAccountName)
 * @param password - User's password
 * @returns Authentication result with user details
 */
export async function authenticateUser(username: string, password: string): Promise<{
    success: boolean
    error?: string
    user?: {
        username: string
        displayName: string
        email?: string
    }
}> {
    const client = new Client({
        url: LDAP_CONFIG.url,
        timeout: 10000,
        connectTimeout: 10000,
    })

    try {
        // Try to bind with user credentials
        const userDN = `${username}@${LDAP_CONFIG.domain}`
        await client.bind(userDN, password)

        // If bind successful, authentication is valid
        // Now get user details
        await client.unbind()

        // Rebind with service account to search for user details
        await client.bind(LDAP_CONFIG.serviceAccount, LDAP_CONFIG.servicePassword)

        const { searchEntries } = await client.search(LDAP_CONFIG.baseDN, {
            scope: 'sub',
            filter: `(sAMAccountName=${username})`,
            attributes: ['cn', 'sAMAccountName', 'mail', 'displayName']
        })

        if (searchEntries.length > 0) {
            const entry = searchEntries[0]
            return {
                success: true,
                user: {
                    username: String(entry.sAMAccountName),
                    displayName: String(entry.displayName || entry.cn || username),
                    email: entry.mail ? String(entry.mail) : undefined
                }
            }
        }

        return { success: false, error: 'User not found in Active Directory' }
    } catch (error: any) {
        console.error('LDAP Authentication Error:', error)
        const errorMsg = error?.message || error?.code || String(error)

        // Check if it's an invalid credentials error
        if (errorMsg.includes('InvalidCredentialsError') || errorMsg.includes('error:49')) {
            return { success: false, error: 'Invalid username or password' }
        }

        // Return the actual error for connection issue detection
        return { success: false, error: `Connection failed: ${errorMsg}` }
    } finally {
        try {
            await client.unbind()
        } catch (e) {
            // Ignore unbind errors
        }
    }
}
