'use server'

import { login as performLogin, logout as performLogout } from './auth'
import { redirect } from 'next/navigation'

/**
 * Server action for login form
 */
export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        return { success: false, error: 'Username and password are required' }
    }

    const result = await performLogin(username, password)

    if (result.success) {
        // Redirect based on role
        if (result.user?.role === 'USER') {
            redirect('/')
        } else {
            redirect('/admin')
        }
    }

    return result
}

/**
 * Server action for logout
 */
export async function logoutAction() {
    await performLogout()
    redirect('/login')
}
