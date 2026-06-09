import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/accounts/fees/bulk
// Two modes:
//   mode "import"  — body: { fees: Array<{studentName, gradeAr, amount, academicYear, seatNumber?, isPaid?, notes?}> }
//   mode "assign"  — body: { amount, academicYear, notes? } → creates FeeRecord for every active StudentFile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode?: 'import' | 'assign'
      fees?: Record<string, string | number>[]
      amount?: number
      academicYear?: string
      notes?: string
    }

    // ── Bulk assign to all active students ──────────────────────────────
    if (body.mode === 'assign') {
      const { amount, academicYear, notes } = body
      if (!amount || !academicYear) {
        return NextResponse.json({ error: 'المبلغ والعام الدراسي مطلوبان' }, { status: 400 })
      }
      const students = await prisma.studentFile.findMany({
        where: { status: 'active' },
        select: { seatNumber: true, nameAr: true, gradeAr: true },
      })
      let created = 0
      for (const s of students) {
        const exists = await prisma.feeRecord.findFirst({
          where: { seatNumber: s.seatNumber, academicYear: String(academicYear) },
        })
        if (!exists) {
          await prisma.feeRecord.create({
            data: { studentName: s.nameAr, seatNumber: s.seatNumber, gradeAr: s.gradeAr, amount: Number(amount), academicYear: String(academicYear), notes: notes ?? undefined },
          })
          created++
        }
      }
      return NextResponse.json({ created, skipped: students.length - created })
    }

    // ── Excel import ─────────────────────────────────────────────────────
    const { fees } = body
    if (!Array.isArray(fees) || fees.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }
    let created = 0
    const errors: string[] = []
    for (const f of fees) {
      const studentName = String(f.studentName ?? '').trim()
      const gradeAr     = String(f.gradeAr ?? '').trim()
      const amount      = Number(f.amount)
      const academicYear = String(f.academicYear ?? '').trim()
      if (!studentName || !gradeAr || !amount || !academicYear) {
        errors.push(`صف ناقص: ${JSON.stringify(f)}`); continue
      }
      try {
        await prisma.feeRecord.create({
          data: {
            studentName,
            seatNumber: f.seatNumber ? String(f.seatNumber).trim() : undefined,
            gradeAr,
            amount,
            academicYear,
            isPaid: String(f.isPaid ?? '').toLowerCase() === 'true' || f.isPaid === 1,
            notes: f.notes ? String(f.notes).trim() : undefined,
          },
        })
        created++
      } catch (e) {
        errors.push(`${studentName}: ${e instanceof Error ? e.message : 'خطأ'}`)
      }
    }
    return NextResponse.json({ created, errors })
  } catch (err) {
    console.error('[accounts/fees/bulk POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
