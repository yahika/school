import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [semesters, totalResults, passResults, reviews] = await Promise.all([
    prisma.semester.findMany({
      select: { id: true, nameAr: true, nameEn: true, academicYear: true, term: true, isPublished: true, createdAt: true, _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.result.count(),
    prisma.result.count({ where: { status: 'pass' } }),
    prisma.resultReview.findMany({ include: { semester: { select: { nameAr: true, academicYear: true, term: true } } } }),
  ])

  const reviewBySemester = new Map(reviews.map(r => [r.semesterId, r]))
  let publishedCount = 0, reviewApproved = 0, reviewNeedsChanges = 0, reviewPending = 0
  const queue: { id: number; nameAr: string; nameEn: string; academicYear: string; term: string; totalStudents: number; isPublished: boolean; reviewStatus: string }[] = []

  for (const s of semesters) {
    if (s.isPublished) publishedCount++
    const review = reviewBySemester.get(s.id)
    const status = review?.status ?? 'pending'
    if (status === 'approved') reviewApproved++
    else if (status === 'needs_changes') reviewNeedsChanges++
    else reviewPending++
    if (status !== 'approved') {
      queue.push({ id: s.id, nameAr: s.nameAr, nameEn: s.nameEn, academicYear: s.academicYear, term: s.term, totalStudents: s._count.results, isPublished: s.isPublished, reviewStatus: status })
    }
  }

  const recentlyReviewed = reviews
    .filter(r => r.reviewedAt)
    .sort((a, b) => new Date(b.reviewedAt as Date).getTime() - new Date(a.reviewedAt as Date).getTime())
    .slice(0, 6)
    .map(r => ({ id: r.id, semesterId: r.semesterId, nameAr: r.semester.nameAr, academicYear: r.semester.academicYear, term: r.semester.term, status: r.status, note: r.note, reviewedBy: r.reviewedBy, reviewedAt: r.reviewedAt }))

  return NextResponse.json({
    totalSemesters: semesters.length,
    publishedCount,
    unpublishedCount: semesters.length - publishedCount,
    reviewPending,
    reviewApproved,
    reviewNeedsChanges,
    totalResults,
    overallPassCount: passResults,
    overallFailCount: totalResults - passResults,
    overallPassRate: totalResults > 0 ? Math.round((passResults / totalResults) * 1000) / 10 : 0,
    queue: queue.slice(0, 6),
    recentlyReviewed,
  })
}
