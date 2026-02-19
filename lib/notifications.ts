import { prisma } from './prisma'
import { sendEmail } from './email'

type NotificationResult = {
    totalShifts: number
    emailsSent: number
    emailsFailed: number
    skippedNoEmail: number
    details: Array<{
        doctorName: string
        email: string | null
        status: 'sent' | 'failed' | 'no-email'
        error?: string
    }>
}

/**
 * Find all shifts that are scheduled for tomorrow and send reminder emails
 * to the assigned staff members.
 * 
 * For multi-day shifts: sends notification if tomorrow falls within the shift range.
 * For fixed shifts: skips them (they are permanent assignments).
 */
export async function sendShiftReminders(): Promise<NotificationResult> {
    const result: NotificationResult = {
        totalShifts: 0,
        emailsSent: 0,
        emailsFailed: 0,
        skippedNoEmail: 0,
        details: []
    }

    // Calculate tomorrow's date range (midnight to midnight)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Find shifts where:
    // 1. Start date IS tomorrow (single-day shift starting tomorrow)
    // 2. Start date is before/on tomorrow AND end date is on/after tomorrow (multi-day shift covering tomorrow)
    // Exclude fixed shifts since they are permanent
    const shifts = await prisma.shift.findMany({
        where: {
            isFixed: false,
            OR: [
                // Single-day shifts starting tomorrow
                {
                    date: {
                        gte: tomorrow,
                        lt: dayAfterTomorrow
                    }
                },
                // Multi-day shifts that cover tomorrow
                {
                    date: {
                        lt: dayAfterTomorrow // started before end of tomorrow
                    },
                    endDate: {
                        gte: tomorrow // ends on or after tomorrow
                    }
                }
            ]
        },
        include: {
            doctor: {
                include: {
                    department: true
                }
            },
            tier: true,
            specialty: true
        }
    })

    result.totalShifts = shifts.length

    // Deduplicate by doctor (a doctor might have multiple shifts)
    // Group shifts by doctor for a single combined email
    const shiftsByDoctor = new Map<number, typeof shifts>()
    for (const shift of shifts) {
        const existing = shiftsByDoctor.get(shift.doctorId) || []
        existing.push(shift)
        shiftsByDoctor.set(shift.doctorId, existing)
    }

    for (const [doctorId, doctorShifts] of shiftsByDoctor) {
        const doctor = doctorShifts[0].doctor

        if (!doctor.email) {
            result.skippedNoEmail++
            result.details.push({
                doctorName: doctor.name,
                email: null,
                status: 'no-email'
            })
            continue
        }

        // Build email content
        const tomorrowStr = tomorrow.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const shiftLines = doctorShifts.map(s => {
            const dept = s.doctor.department.name
            const tier = s.tier.name
            const specialty = s.specialty?.name || 'General'
            const timeStr = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : 'Full day'
            return { dept, tier, specialty, timeStr, isBackup: s.isBackup }
        })

        const textBody = `Dear ${doctor.name},\n\nThis is a reminder that you have the following on-call shift(s) scheduled for tomorrow, ${tomorrowStr}:\n\n${shiftLines.map(s => `• ${s.dept} - ${s.tier} (${s.specialty})${s.isBackup ? ' [BACKUP]' : ''}\n  Time: ${s.timeStr}`).join('\n\n')}\n\nPlease ensure you are available and reachable.\n\nBest regards,\nSQCCCRC On-Call System`

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; }
        .shift-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .shift-dept { font-weight: 700; color: #1e293b; font-size: 15px; }
        .shift-tier { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 4px; }
        .shift-time { color: #64748b; font-size: 13px; margin-top: 6px; }
        .backup-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ On-Call Shift Reminder</h1>
            <p>${tomorrowStr}</p>
        </div>
        <div class="content">
            <p>Dear <strong>${doctor.name}</strong>,</p>
            <p>This is a reminder that you have the following on-call shift(s) scheduled for <strong>tomorrow</strong>:</p>
            
            ${shiftLines.map(s => `
            <div class="shift-card">
                <div class="shift-dept">${s.dept}</div>
                <span class="shift-tier">${s.tier} • ${s.specialty}</span>
                ${s.isBackup ? '<span class="backup-badge">BACKUP</span>' : ''}
                <div class="shift-time">🕐 ${s.timeStr}</div>
            </div>
            `).join('')}
            
            <p style="margin-top: 20px;">Please ensure you are available and reachable during your shift.</p>
            <p>Best regards,<br><strong>SQCCCRC On-Call System</strong></p>
        </div>
        <div class="footer">
            This is an automated notification from the On-Call Dashboard.
        </div>
    </div>
</body>
</html>`

        const emailResult = await sendEmail({
            to: doctor.email,
            subject: `🔔 On-Call Reminder: You're on call tomorrow (${tomorrowStr})`,
            text: textBody,
            html: htmlBody
        })

        if (emailResult.success) {
            result.emailsSent++
            result.details.push({
                doctorName: doctor.name,
                email: doctor.email,
                status: 'sent'
            })
        } else {
            result.emailsFailed++
            result.details.push({
                doctorName: doctor.name,
                email: doctor.email,
                status: 'failed',
                error: emailResult.error
            })
        }
    }

    return result
}
