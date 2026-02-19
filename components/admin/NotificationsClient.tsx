'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, Settings, Mail, AlertTriangle } from 'lucide-react'

type SmtpStatus = {
    smtpConfigured: boolean
    smtpConnected: boolean
    smtpError?: string
    envVars: Record<string, string>
}

type NotificationResult = {
    success: boolean
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
    timestamp: string
}

export function NotificationsClient() {
    const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null)
    const [checking, setChecking] = useState(false)
    const [sending, setSending] = useState(false)
    const [sendingTest, setSendingTest] = useState(false)
    const [testEmail, setTestEmail] = useState('info@cccrc.gov.om')
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
    const [result, setResult] = useState<NotificationResult | null>(null)
    const [error, setError] = useState('')

    async function checkSmtp() {
        setChecking(true)
        setError('')
        try {
            const res = await fetch('/api/notify-shifts')
            const data = await res.json()
            setSmtpStatus(data)
        } catch (err: any) {
            setError('Failed to check SMTP: ' + err.message)
        } finally {
            setChecking(false)
        }
    }

    async function sendTestEmail() {
        if (!testEmail) return
        setSendingTest(true)
        setTestResult(null)
        try {
            const res = await fetch(`/api/notify-shifts?test-email=${encodeURIComponent(testEmail)}`, { method: 'POST' })
            const data = await res.json()
            setTestResult(data)
        } catch (err: any) {
            setTestResult({ success: false, error: err.message })
        } finally {
            setSendingTest(false)
        }
    }

    async function sendNotifications() {
        if (!confirm('Send shift reminder emails to all staff with shifts tomorrow?')) return

        setSending(true)
        setError('')
        setResult(null)
        try {
            const res = await fetch('/api/notify-shifts', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Failed to send notifications')
            }
        } catch (err: any) {
            setError('Failed to send notifications: ' + err.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* SMTP Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings className="text-slate-500" size={20} />
                        <h3 className="font-bold text-slate-800">SMTP Configuration</h3>
                    </div>
                    <button
                        onClick={checkSmtp}
                        disabled={checking}
                        className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {checking ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                        {checking ? 'Checking...' : 'Check Connection'}
                    </button>
                </div>

                <div className="p-6">
                    {!smtpStatus ? (
                        <p className="text-sm text-slate-500 italic">Click &quot;Check Connection&quot; to verify SMTP setup.</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                {smtpStatus.smtpConnected ? (
                                    <CheckCircle size={18} className="text-green-500" />
                                ) : (
                                    <AlertCircle size={18} className="text-red-500" />
                                )}
                                <span className={`font-semibold ${smtpStatus.smtpConnected ? 'text-green-700' : 'text-red-700'}`}>
                                    {smtpStatus.smtpConnected ? 'SMTP Connected' : 'SMTP Not Connected'}
                                </span>
                            </div>
                            {smtpStatus.smtpError && (
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{smtpStatus.smtpError}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                {Object.entries(smtpStatus.envVars).map(([key, value]) => (
                                    <div key={key} className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="font-mono text-slate-500">{key}</span>
                                        <br />
                                        <span className={value.startsWith('✓') ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Send Test Email Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                    <div className="flex items-center gap-3">
                        <Send className="text-emerald-500" size={20} />
                        <div>
                            <h3 className="font-bold text-slate-800">Send Test Email</h3>
                            <p className="text-xs text-slate-500">Verify email delivery to a specific address</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex gap-3">
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                            onClick={sendTestEmail}
                            disabled={sendingTest || !testEmail}
                            className="px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {sendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {sendingTest ? 'Sending...' : 'Send Test'}
                        </button>
                    </div>
                    {testResult && (
                        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${testResult.success
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">
                                {testResult.success
                                    ? `Test email sent to ${testEmail}! Check your inbox.`
                                    : `Failed: ${testResult.error}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Send Notifications Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mail className="text-blue-500" size={20} />
                        <div>
                            <h3 className="font-bold text-slate-800">Send Shift Reminders</h3>
                            <p className="text-xs text-slate-500">Notify staff about their shifts tomorrow</p>
                        </div>
                    </div>
                    <button
                        onClick={sendNotifications}
                        disabled={sending}
                        className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {sending ? 'Sending...' : 'Send Reminders Now'}
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2 mb-4">
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-800">{result.totalShifts}</div>
                                    <div className="text-xs text-slate-500 font-medium">Total Shifts</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                                    <div className="text-2xl font-bold text-green-700">{result.emailsSent}</div>
                                    <div className="text-xs text-green-600 font-medium">Emails Sent</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                                    <div className="text-2xl font-bold text-red-700">{result.emailsFailed}</div>
                                    <div className="text-xs text-red-600 font-medium">Failed</div>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                                    <div className="text-2xl font-bold text-amber-700">{result.skippedNoEmail}</div>
                                    <div className="text-xs text-amber-600 font-medium">No Email</div>
                                </div>
                            </div>

                            {/* Details */}
                            {result.details.length > 0 && (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-600">Staff</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-600">Email</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.details.map((d, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 font-medium text-slate-800">{d.doctorName}</td>
                                                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{d.email || '—'}</td>
                                                    <td className="px-4 py-2">
                                                        {d.status === 'sent' && (
                                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
                                                                <CheckCircle size={12} /> Sent
                                                            </span>
                                                        )}
                                                        {d.status === 'failed' && (
                                                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-medium" title={d.error}>
                                                                <AlertCircle size={12} /> Failed
                                                            </span>
                                                        )}
                                                        {d.status === 'no-email' && (
                                                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                                                                <AlertTriangle size={12} /> No Email
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 text-right">
                                Sent at {new Date(result.timestamp).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {!result && !error && (
                        <div className="text-center py-6">
                            <Mail size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500">
                                Click &quot;Send Reminders Now&quot; to email all staff with shifts tomorrow.
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                For automated daily emails, set up a cron job to POST to <code className="bg-slate-100 px-1 py-0.5 rounded">/api/notify-shifts</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Setup Guide */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">Setup Guide</h3>
                <div className="text-xs text-slate-600 space-y-2">
                    <p><strong>1. Configure SMTP</strong> — Add these to your <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> file:</p>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px]">
                        {`SMTP_HOST=mail.sqcccrc.med.sa
SMTP_PORT=25
SMTP_FROM=oncall-system@sqcccrc.med.sa
# If authentication is required:
SMTP_USER=your-username
SMTP_PASS=your-password
# Optional API secret for cron:
NOTIFICATION_API_SECRET=your-secret-key`}
                    </pre>
                    <p><strong>2. Automate</strong> — Set up a daily cron job (e.g., at 8 AM):</p>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px]">
                        {`# crontab -e
0 8 * * * curl -X POST http://localhost:3000/api/notify-shifts \\
  -H "x-api-secret: your-secret-key"`}
                    </pre>
                </div>
            </div>
        </div>
    )
}
