import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { login as apiLogin, setAuthToken } from '../services/api'

interface User {
    id: number
    username: string
    displayName: string
    role: string
    department: string | null
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStoredAuth()
    }, [])

    async function loadStoredAuth() {
        try {
            const storedToken = await SecureStore.getItemAsync('auth_token')
            const storedUser = await SecureStore.getItemAsync('auth_user')
            if (storedToken && storedUser) {
                setAuthToken(storedToken)
                setToken(storedToken)
                setUser(JSON.parse(storedUser))
            }
        } catch (e) {
            console.error('Failed to load auth:', e)
        } finally {
            setIsLoading(false)
        }
    }

    async function login(username: string, password: string) {
        const data = await apiLogin(username, password)
        setToken(data.token)
        setUser(data.user)
        await SecureStore.setItemAsync('auth_token', data.token)
        await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user))
    }

    async function logout() {
        setToken(null)
        setUser(null)
        setAuthToken(null)
        await SecureStore.deleteItemAsync('auth_token')
        await SecureStore.deleteItemAsync('auth_user')
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
