import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

// GET ?date=YYYY-MM-DD&grade=... → roster for that grade + any saved statuses for that date
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const grade = req.nextUrl.searchParams.get('grade')
  if (!date || !grade) return NextResponse.json({ error: 'التاريخ والصف مطلوبان' }, { status: 400 })

  const roster = await prisma.result.findMany({
    where: { gradeAr: grade },
    orderBy: { createdAt: 'desc' },
    distinct: ['seatNumber'],
    select: { seatNumber: true, nameAr: true, gradeAr: true },
  })

  const existing = await prisma.attendanceRecord.findMany({ where: { date, gradeAr: grade } })
  const byseat = new Map(existing.map(e => [e.seatNumber, e]))

  const rows = roster
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'))
    .map(r => ({
      seatNumber: r.seatNumber,
      studentName: r.nameAr,
      gradeAr: r.gradeAr,
      status: byseat.get(r.seatNumber)?.status ?? 'present',
      notes: byseat.get(r.seatNumber)?.notes ?? '',
      saved: byseat.has(r.seatNumber),
    }))

  const summary = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const e of existing) if (e.status in summary) (summary as Record<string, number>)[e.status]++

  return NextResponse.json({ rows, summary, savedCount: existing.length, total: roster.length })
}

// POST { date, gradeAr, records: [{ seatNumber, studentName, gradeAr, status, notes? }] }
export async function POST(req: NextRequest) {
  try {
    const staff = await getStaffFromCookies()
    const b = await req.json()
    const { date, gradeAr, records } = b
    if (!date || !gradeAr || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    await prisma.$transaction(
      records.map((r: { seatNumber: string; studentName: string; gradeAr: string; status: string; notes?: string }) =>
        prisma.attendanceRecord.upsert({
          where: { seatNumber_date: { seatNumber: r.seatNumber, date } },
          create: {
            seatNumber: r.seatNumber, studentName: r.studentName, gradeAr: r.gradeAr || gradeAr,
            date, status: r.status, notes: r.notes?.trim() || null,
          },
          update: { status: r.status, notes: r.notes?.trim() || null, studentName: r.studentName },
        })
      )
    )

    return NextResponse.json({ success: true, savedBy: staff?.name ?? null, count: records.length })
  } catch (err) {
    console.error('[staff/student-affairs/attendance POST]', err)
    return NextResponse.json({ error: 'تعذّر حفظ سجل الحضور' }, { status: 500 })
  }
}
