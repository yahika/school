import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const where = search
    ? { OR: [{ studentName: { contains: search } }, { seatNumber: { contains: search } }] }
    : {}
  const notes = await prisma.conductNote.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest) {
  try {
    const staff = await getStaffFromCookies()
    const b = await req.json()
    if (!b.seatNumber?.trim() || !b.studentName?.trim() || !b.description?.trim() || !b.type) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }
    if (!['positive', 'negative', 'note'].includes(b.type)) {
      return NextResponse.json({ error: 'نوع الملاحظة غير صحيح' }, { status: 400 })
    }

    const note = await prisma.conductNote.create({
      data: {
        seatNumber: b.seatNumber.trim(),
        studentName: b.studentName.trim(),
        gradeAr: b.gradeAr?.trim() || '',
        date: b.date || new Date().toISOString().slice(0, 10),
        type: b.type,
        description: b.description.trim(),
        recordedBy: staff?.name ?? null,
      },
    })
    return NextResponse.json({ success: true, note })
  } catch (err) {
    console.error('[staff/student-affairs/conduct POST]', err)
    return NextResponse.json({ error: 'تعذّر إضافة الملاحظة' }, { status: 500 })
  }
}
