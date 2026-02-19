import nodemailer from 'nodemailer'

// SMTP transporter - configure via env vars
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    ...(process.env.SMTP_USER && process.env.SMTP_PASS ? {
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    } : {}),
    // For internal hospital SMTP that may not have valid certs
    tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
    }
})

export type EmailOptions = {
    to: string
    subject: string
    text: string
    html: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
        const from = process.env.SMTP_FROM || 'oncall-system@sqcccrc.med.sa'

        await transporter.sendMail({
            from,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        })

        return { success: true }
    } catch (error: any) {
        console.error('Failed to send email:', error)
        return { success: false, error: error.message }
    }
}

export async function verifySmtpConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
        await transporter.verify()
        return { connected: true }
    } catch (error: any) {
        console.error('SMTP connection failed:', error)
        return { connected: false, error: error.message }
    }
}
