import { NextRequest, NextResponse } from 'next/server'
import { sendShiftReminders } from '@/lib/notifications'
import { verifySmtpConnection } from '@/lib/email'

/**
 * POST /api/notify-shifts
 * 
 * Triggers shift reminder emails for tomorrow.
 * Call this daily via cron job, or manually from admin panel.
 * 
 * Optional query param: ?test=true to just check SMTP connection
 * 
 * Security: Protected by API_SECRET header or admin session
 */
export async function POST(request: NextRequest) {
    // Simple API key protection for external cron services
    const apiSecret = request.headers.get('x-api-secret')
    const expectedSecret = process.env.NOTIFICATION_API_SECRET

    if (expectedSecret && apiSecret !== expectedSecret) {
        // If API secret is set but doesn't match, check for admin session cookie instead
        const sessionCookie = request.cookies.get('session')
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const { searchParams } = new URL(request.url)

    // Test mode: just verify SMTP connection
    if (searchParams.get('test') === 'true') {
        const smtpStatus = await verifySmtpConnection()
        return NextResponse.json({
            mode: 'test',
            smtp: smtpStatus
        })
    }

    // Send test email to a specific address
    const testEmail = searchParams.get('test-email')
    if (testEmail) {
        const { sendEmail } = await import('@/lib/email')
        const result = await sendEmail({
            to: testEmail,
            subject: '✅ SQCCCRC On-Call System — Test Email',
            text: 'This is a test email from the SQCCCRC On-Call Dashboard notification system. If you received this, your SMTP configuration is working correctly.',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .card { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 32px; text-align: center; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h2 { color: #166534; margin: 0 0 8px; }
        p { color: #475569; font-size: 14px; line-height: 1.6; }
        .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="icon">✅</div>
            <h2>Test Email Successful!</h2>
            <p>This is a test email from the <strong>SQCCCRC On-Call Dashboard</strong>.</p>
            <p>Your SMTP configuration is working correctly.<br>Shift reminder emails will be delivered to this address.</p>
        </div>
        <div class="footer">
            Sent at ${new Date().toLocaleString()} — SQCCCRC On-Call System
        </div>
    </div>
</body>
</html>`
        })
        return NextResponse.json({
            mode: 'test-email',
            to: testEmail,
            ...result,
            timestamp: new Date().toISOString()
        })
    }

    try {
        const result = await sendShiftReminders()
        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Notification API error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

// GET endpoint to check status
export async function GET() {
    const smtpStatus = await verifySmtpConnection()
    return NextResponse.json({
        service: 'shift-notifications',
        smtpConfigured: !!process.env.SMTP_HOST,
        smtpConnected: smtpStatus.connected,
        smtpError: smtpStatus.error,
        envVars: {
            SMTP_HOST: process.env.SMTP_HOST ? '✓ set' : '✗ missing',
            SMTP_PORT: process.env.SMTP_PORT ? '✓ set' : '✗ missing (default 25)',
            SMTP_FROM: process.env.SMTP_FROM ? '✓ set' : '✗ missing (using default)',
        }
    })
}
