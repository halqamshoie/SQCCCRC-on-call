'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText, Loader2, Download } from 'lucide-react'

type Props = {
    startDate?: string
    endDate?: string
    departmentId?: number
}

export function ExportButtons({ startDate, endDate, departmentId }: Props) {
    const [exportingPdf, setExportingPdf] = useState(false)
    const [exportingXlsx, setExportingXlsx] = useState(false)

    function buildUrl(format: string) {
        const params = new URLSearchParams()
        params.set('format', format)
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        if (departmentId) params.set('departmentId', departmentId.toString())
        return `/api/export/schedule?${params}`
    }

    async function handleExportXlsx() {
        setExportingXlsx(true)
        try {
            const res = await fetch(buildUrl('xlsx'))
            if (!res.ok) throw new Error('Export failed')
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `schedule_${startDate || 'all'}_${endDate || 'all'}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Excel export failed:', error)
            alert('Failed to export Excel file')
        } finally {
            setExportingXlsx(false)
        }
    }

    async function handleExportPdf() {
        setExportingPdf(true)
        try {
            // Fetch data as JSON
            const res = await fetch(buildUrl('json'))
            const data = await res.json()

            if (!data.rows || data.rows.length === 0) {
                alert('No data to export')
                return
            }

            // Dynamic import of jspdf
            const { jsPDF } = await import('jspdf')
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

            // Title
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('SQCCCRC On-Call Schedule', 14, 15)

            // Date range subtitle
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 100, 100)
            const dateRange = startDate && endDate
                ? `${new Date(startDate).toLocaleDateString('en-GB')} — ${new Date(endDate).toLocaleDateString('en-GB')}`
                : 'All dates'
            doc.text(`Period: ${dateRange}  |  Generated: ${new Date().toLocaleDateString('en-GB')}  |  Total: ${data.rows.length} shifts`, 14, 21)

            // Table
            const headers = Object.keys(data.rows[0])
            const rows = data.rows.map((row: any) => headers.map(h => row[h]))

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 26,
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [30, 41, 59], // slate-800
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252] // slate-50
                },
                columnStyles: {
                    0: { cellWidth: 22 }, // Date
                    1: { cellWidth: 22 }, // End Date
                    2: { cellWidth: 40 }, // Staff Name
                    3: { cellWidth: 30 }, // Department
                    4: { cellWidth: 25 }, // Specialty
                    5: { cellWidth: 25 }, // Tier
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data: any) => {
                    // Footer
                    doc.setFontSize(7)
                    doc.setTextColor(150, 150, 150)
                    doc.text(
                        `SQCCCRC On-Call System — Page ${data.pageNumber}`,
                        doc.internal.pageSize.getWidth() / 2,
                        doc.internal.pageSize.getHeight() - 8,
                        { align: 'center' }
                    )
                }
            })

            doc.save(`schedule_${startDate || 'all'}_${endDate || 'all'}.pdf`)
        } catch (error) {
            console.error('PDF export failed:', error)
            alert('Failed to export PDF file')
        } finally {
            setExportingPdf(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
                {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Export PDF
            </button>

            <button
                onClick={handleExportXlsx}
                disabled={exportingXlsx}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
                {exportingXlsx ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                Export Excel
            </button>
        </div>
    )
}
