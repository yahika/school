import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
// @ts-ignore
import PDFDocument from 'pdfkit'

export async function GET(_req: NextRequest, { params }: { params: { resultId: string } }) {
  try {
    const result = await prisma.result.findUnique({
      where: { id: parseInt(params.resultId) },
      include: {
        subjects: { orderBy: { orderIdx: 'asc' } },
        semester: true,
      },
    })

    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const doc = new PDFDocument({ size: 'A4', margin: 50, rtl: false })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())

      const GREEN = '#0a5c36'
      const GOLD = '#c8972b'
      const DARK = '#1e293b'
      const GRAY = '#64748b'
      const pageW = doc.page.width
      const margin = 50
      const contentW = pageW - margin * 2

      // ── HEADER ──────────────────────────────────────────────────────────────
      // Green header bar
      doc.rect(0, 0, pageW, 110).fill(GREEN)

      // School name
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
        .text('Alexandria Elite Academy', margin, 25, { align: 'center', width: contentW })
      doc.fontSize(11).font('Helvetica')
        .text('أكاديمية النخبة بالإسكندرية', margin, 52, { align: 'center', width: contentW })

      // Gold accent line
      doc.rect(0, 78, pageW, 3).fill(GOLD)

      // Report title
      doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
        .text('OFFICIAL ACADEMIC REPORT CARD', margin, 85, { align: 'center', width: contentW })

      // ── STUDENT INFO BOX ────────────────────────────────────────────────────
      const infoY = 125
      doc.rect(margin, infoY, contentW, 90).fill('#f0fdf4').stroke('#86efac')

      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text('STUDENT INFORMATION', margin + 15, infoY + 12)

      doc.font('Helvetica').fontSize(10)
      const col1 = margin + 15
      const col2 = margin + contentW / 2

      doc.fillColor(GRAY).text('Student Name (Arabic):', col1, infoY + 30)
      doc.fillColor(DARK).font('Helvetica-Bold').text(result.nameAr, col1, infoY + 44)

      doc.fillColor(GRAY).font('Helvetica').text('Student Name (English):', col2, infoY + 30)
      doc.fillColor(DARK).font('Helvetica-Bold').text(result.nameEn ?? '—', col2, infoY + 44)

      doc.fillColor(GRAY).font('Helvetica').text('Seat Number:', col1, infoY + 62)
      doc.fillColor(GREEN).font('Helvetica-Bold').text(result.seatNumber, col1 + 75, infoY + 62)

      doc.fillColor(GRAY).font('Helvetica').text('Grade:', col2, infoY + 62)
      doc.fillColor(DARK).font('Helvetica-Bold').text(result.gradeEn ?? result.gradeAr, col2 + 40, infoY + 62)

      // Semester info
      const semY = infoY + 105
      doc.rect(margin, semY, contentW, 35).fill('#f8fafc').stroke('#e2e8f0')
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
        .text('SEMESTER:', margin + 15, semY + 12)
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10)
        .text(result.semester.nameEn, margin + 80, semY + 11)
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
        .text('Academic Year:', col2, semY + 12)
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
        .text(result.semester.academicYear, col2 + 90, semY + 12)

      // ── SUBJECTS TABLE ───────────────────────────────────────────────────────
      const tableY = semY + 52
      const rowH = 26
      const cols = [contentW * 0.40, contentW * 0.15, contentW * 0.15, contentW * 0.15, contentW * 0.15]
      const colX = [margin, margin + cols[0], margin + cols[0] + cols[1], margin + cols[0] + cols[1] + cols[2], margin + cols[0] + cols[1] + cols[2] + cols[3]]

      // Table header
      doc.rect(margin, tableY, contentW, rowH).fill(GREEN)
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
      const headers = ['Subject', 'Score', 'Max', 'Percentage', 'Result']
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 4, tableY + 8, { width: cols[i] - 8, align: i === 0 ? 'left' : 'center' })
      })

      // Subject rows
      result.subjects.forEach((sub, idx) => {
        const rowY = tableY + rowH + idx * rowH
        const pct = Math.round((sub.score / sub.maxScore) * 100)
        const passed = sub.status === 'pass'

        doc.rect(margin, rowY, contentW, rowH).fill(idx % 2 === 0 ? '#f8fafc' : 'white').stroke('#e2e8f0')

        doc.fillColor(DARK).font('Helvetica').fontSize(9)
          .text(sub.nameEn ?? sub.nameAr, colX[0] + 4, rowY + 8, { width: cols[0] - 8, align: 'left' })

        doc.fillColor(passed ? GREEN : '#dc2626').font('Helvetica-Bold')
          .text(String(sub.score), colX[1] + 4, rowY + 8, { width: cols[1] - 8, align: 'center' })

        doc.fillColor(GRAY).font('Helvetica')
          .text(String(sub.maxScore), colX[2] + 4, rowY + 8, { width: cols[2] - 8, align: 'center' })
          .text(`${pct}%`, colX[3] + 4, rowY + 8, { width: cols[3] - 8, align: 'center' })

        doc.fillColor(passed ? GREEN : '#dc2626').font('Helvetica-Bold')
          .text(passed ? 'PASS' : 'FAIL', colX[4] + 4, rowY + 8, { width: cols[4] - 8, align: 'center' })
      })

      // ── SUMMARY ─────────────────────────────────────────────────────────────
      const summaryY = tableY + rowH + result.subjects.length * rowH + 16
      const isPass = result.status === 'pass'

      doc.rect(margin, summaryY, contentW, 55).fill(isPass ? '#f0fdf4' : '#fef2f2')
        .stroke(isPass ? '#86efac' : '#fca5a5')

      doc.fillColor(isPass ? GREEN : '#dc2626').font('Helvetica-Bold').fontSize(11)
        .text('FINAL RESULT', margin + 15, summaryY + 10)

      doc.fillColor(DARK).font('Helvetica').fontSize(10)
        .text(`Total Score: ${result.totalScore} / ${result.maxScore}`, margin + 15, summaryY + 28)
        .text(`Percentage: ${result.percentage}%`, margin + 160, summaryY + 28)

      if (result.letterGrade) {
        doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(14)
          .text(result.letterGrade, margin + 290, summaryY + 20)
      }

      doc.fillColor(isPass ? '#15803d' : '#dc2626').font('Helvetica-Bold').fontSize(18)
        .text(isPass ? '✓ PASSED' : '✗ FAILED', margin + 350, summaryY + 18)

      // ── FOOTER ──────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 80
      doc.rect(0, footerY, pageW, 80).fill(GREEN)

      doc.fillColor('white').font('Helvetica').fontSize(8)
        .text('This is an official document issued by Alexandria Elite Academy.', margin, footerY + 12, { align: 'center', width: contentW })
        .text(`Print Date: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, footerY + 26, { align: 'center', width: contentW })

      // Gold QR placeholder line
      doc.rect(margin + contentW / 2 - 50, footerY + 40, 100, 2).fill(GOLD)
      doc.fillColor('rgba(255,255,255,0.5)').fontSize(7)
        .text('Alexandria Elite Academy © 2026 | All Rights Reserved', margin, footerY + 50, { align: 'center', width: contentW })

      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)
    const filename = `ReportCard_${result.seatNumber}_${result.semester.academicYear.replace('/', '-')}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
