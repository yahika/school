import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PATCH /api/staff/results-control/semesters/[id]/publish — toggle whether parents can see this semester's results
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()
    if (typeof b.isPublished !== 'boolean') {
      return NextResponse.json({ error: 'قيمة غير صحيحة' }, { status: 400 })
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: { isPublished: b.isPublished, publishedAt: b.isPublished ? new Date() : null },
    })
    return NextResponse.json({ success: true, semester })
  } catch (err) {
    console.error('[results-control publish PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تحديث حالة النشر' }, { status: 500 })
  }
}
