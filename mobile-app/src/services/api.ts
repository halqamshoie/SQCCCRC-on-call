// Change this to your server's IP address
// Use your computer's local IP when testing on a physical device
// Use localhost when testing in the simulator
const API_BASE = 'http://172.19.25.86:3000/api/mobile'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
    authToken = token
}

export function getAuthToken() {
    return authToken
}

async function request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
    }

    let res: Response
    try {
        res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        })
    } catch (networkError: any) {
        throw new Error(`Network error: ${networkError.message}. Make sure your phone and computer are on the same Wi-Fi.`)
    }

    // Try to parse as JSON, handle HTML error pages
    let data: any
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        data = await res.json()
    } else {
        const text = await res.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error (${res.status}). Got non-JSON response.`)
    }

    if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
    }

    return data
}

// Auth
export async function login(username: string, password: string) {
    const data = await request('/auth', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
    authToken = data.token
    return data
}

// Schedule
export async function getSchedule(date?: string) {
    const params = date ? `?date=${date}` : ''
    return request(`/schedule${params}`)
}

// My Shifts
export async function getMyShifts() {
    return request('/my-shifts')
}

// Swap Requests
export async function getSwapRequests() {
    return request('/swap')
}

export async function createSwapRequest(shiftId: number, reason?: string) {
    return request('/swap', {
        method: 'POST',
        body: JSON.stringify({ shiftId, reason }),
    })
}
