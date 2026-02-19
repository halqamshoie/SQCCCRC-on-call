import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'on-call-session'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Allow public routes
    if (pathname === '/login' || pathname === '/' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
        return NextResponse.next()
    }

    // Check session for /admin routes
    if (pathname.startsWith('/admin')) {
        try {
            // Get cookie value directly
            const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

            if (!sessionCookie || !sessionCookie.value) {
                return NextResponse.redirect(new URL('/login', request.url))
            }

            // For middleware, we just check if session cookie exists
            // Full validation happens in server components/actions
            // Iron-session will decrypt and validate automatically when getSession() is called
            return NextResponse.next()
        } catch (error) {
            console.error('Middleware session error:', error)
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
