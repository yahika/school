import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Live student roster derived from the existing Results data (one row per
// seat number — the most recent semester's record). This is the shared
// source of truth for names/grades used across attendance, conduct & files.
export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get('grade') || undefined

  const results = await prisma.result.findMany({
    orderBy: { createdAt: 'desc' },
    distinct: ['seatNumber'],
    select: { seatNumber: true, nameAr: true, nameEn: true, gradeAr: true, gradeEn: true },
  })

  const roster = grade ? results.filter(r => r.gradeAr === grade) : results

  const grades = Array.from(new Set(results.map(r => r.gradeAr))).sort()
  const byGrade: Record<string, number> = {}
  for (const r of results) byGrade[r.gradeAr] = (byGrade[r.gradeAr] ?? 0) + 1

  return NextResponse.json({
    students: roster.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar')),
    grades,
    gradeBreakdown: grades.map(g => ({ gradeAr: g, count: byGrade[g] })),
    total: results.length,
  })
}
