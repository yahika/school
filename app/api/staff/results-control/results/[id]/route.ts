import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/results-control/results/[id] — single result with full subject breakdown (for spot-checks)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        subjects: { orderBy: { orderIdx: 'asc' } },
        semester: { select: { id: true, nameAr: true, nameEn: true, academicYear: true, term: true, isPublished: true } },
      },
    })
    if (!result) return NextResponse.json({ error: 'النتيجة غير موجودة' }, { status: 404 })
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[results-control result GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
