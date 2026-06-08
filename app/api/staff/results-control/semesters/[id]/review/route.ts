import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'approved', 'needs_changes']

// PATCH /api/staff/results-control/semesters/[id]/review — set/update the review verdict for a semester
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const semesterId = parseInt(params.id)
    const staff = await getStaffFromCookies()
    const b = await req.json()
    if (!VALID_STATUSES.includes(b.status)) {
      return NextResponse.json({ error: 'حالة المراجعة غير صحيحة' }, { status: 400 })
    }

    const semester = await prisma.semester.findUnique({ where: { id: semesterId }, select: { id: true } })
    if (!semester) return NextResponse.json({ error: 'الفصل الدراسي غير موجود' }, { status: 404 })

    const review = await prisma.resultReview.upsert({
      where: { semesterId },
      update: { status: b.status, note: b.note?.trim() || null, reviewedBy: staff?.name ?? null, reviewedAt: new Date() },
      create: { semesterId, status: b.status, note: b.note?.trim() || null, reviewedBy: staff?.name ?? null, reviewedAt: new Date() },
    })
    return NextResponse.json({ success: true, review })
  } catch (err) {
    console.error('[results-control review PATCH]', err)
    return NextResponse.json({ error: 'تعذّر حفظ المراجعة' }, { status: 500 })
  }
}
