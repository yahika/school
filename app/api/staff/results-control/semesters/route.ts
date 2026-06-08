import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/results-control/semesters — list all semesters with stats + review status
export async function GET() {
  const semesters = await prisma.semester.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { results: true } }, resultReview: true },
  })

  const enriched = await Promise.all(
    semesters.map(async sem => {
      const passCount = await prisma.result.count({ where: { semesterId: sem.id, status: 'pass' } })
      const total = sem._count.results
      return {
        id: sem.id,
        nameAr: sem.nameAr,
        nameEn: sem.nameEn,
        academicYear: sem.academicYear,
        term: sem.term,
        isPublished: sem.isPublished,
        publishedAt: sem.publishedAt,
        createdAt: sem.createdAt,
        totalStudents: total,
        passCount,
        failCount: total - passCount,
        passRate: total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0,
        review: sem.resultReview ? {
          status: sem.resultReview.status,
          note: sem.resultReview.note,
          reviewedBy: sem.resultReview.reviewedBy,
          reviewedAt: sem.resultReview.reviewedAt,
        } : null,
      }
    })
  )
  return NextResponse.json({ semesters: enriched })
}
