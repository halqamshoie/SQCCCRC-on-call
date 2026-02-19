import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')

    // Build where clause
    const where: any = {}
    if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date.gte = new Date(startDate)
        if (endDate) where.date.lte = new Date(endDate)
    }
    if (departmentId) {
        where.doctor = { departmentId: parseInt(departmentId) }
    }

    const shifts = await prisma.shift.findMany({
        where,
        include: {
            doctor: {
                include: { department: true }
            },
            tier: true,
            specialty: true
        },
        orderBy: { date: 'asc' }
    })

    // Format the data as flat rows
    const rows = shifts.map(shift => ({
        Date: new Date(shift.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        'End Date': shift.endDate ? new Date(shift.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        'Staff Name': shift.doctor.name,
        Department: shift.doctor.department.name,
        Specialty: shift.specialty?.name || '',
        Tier: shift.tier.name,
        'Is Fixed': shift.isFixed ? 'Yes' : 'No',
        'Is Backup': shift.isBackup ? 'Yes' : 'No',
        Notes: shift.notes || '',
    }))

    if (format === 'xlsx') {
        // Import xlsx dynamically on server
        const XLSX = await import('xlsx')
        const worksheet = XLSX.utils.json_to_sheet(rows)

        // Set column widths
        worksheet['!cols'] = [
            { wch: 14 }, // Date
            { wch: 14 }, // End Date
            { wch: 25 }, // Staff Name
            { wch: 20 }, // Department
            { wch: 20 }, // Specialty
            { wch: 15 }, // Tier
            { wch: 8 },  // Is Fixed
            { wch: 10 }, // Is Backup
            { wch: 30 }, // Notes
        ]

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule')

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="schedule_${startDate || 'all'}_${endDate || 'all'}.xlsx"`
            }
        })
    }

    if (format === 'csv') {
        // CSV export
        if (rows.length === 0) {
            return new NextResponse('No data found', { status: 404 })
        }
        const headers = Object.keys(rows[0])
        const csvLines = [
            headers.join(','),
            ...rows.map(row =>
                headers.map(h => {
                    const val = (row as any)[h]
                    // Escape commas and quotes
                    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                        return `"${val.replace(/"/g, '""')}"`
                    }
                    return val
                }).join(',')
            )
        ]
        const csv = csvLines.join('\n')

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="schedule_${startDate || 'all'}_${endDate || 'all'}.csv"`
            }
        })
    }

    // Default: return JSON for PDF generation on client
    return NextResponse.json({ rows, total: rows.length })
}
