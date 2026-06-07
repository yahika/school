import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeResultStats } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/semesters — list all semesters with counts
export async function GET() {
  const semesters = await prisma.semester.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { results: true } } },
  })

  const enriched = await Promise.all(
    semesters.map(async sem => {
      const passCount = await prisma.result.count({ where: { semesterId: sem.id, status: 'pass' } })
      return {
        ...sem,
        totalStudents: sem._count.results,
        passCount,
        failCount: sem._count.results - passCount,
        passRate: sem._count.results > 0 ? Math.round((passCount / sem._count.results) * 1000) / 10 : 0,
      }
    })
  )
  return NextResponse.json({ semesters: enriched })
}

// POST /api/admin/semesters — bulk-import parsed results from client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nameAr, nameEn, academicYear, term, results } = body

    if (!nameAr || !nameEn || !academicYear || !term || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Reject if subjects weren't parsed (file format mismatch)
    const firstSubjects = results[0]?.subjects
    if (!Array.isArray(firstSubjects) || firstSubjects.length === 0) {
      return NextResponse.json(
        { error: 'No subject scores found. Make sure your file matches the template format (subject columns start at column G).' },
        { status: 400 }
      )
    }

    const semester = await prisma.semester.create({
      data: {
        nameAr, nameEn, academicYear, term,
        isPublished: false,
      },
    })

    // Bulk create results
    for (const r of results) {
      const subjects = (r.subjects as { nameAr: string; nameEn?: string; score: number; maxScore?: number }[]).map(
        (s, idx) => ({
          nameAr: s.nameAr,
          nameEn: s.nameEn ?? '',
          score: Number(s.score),
          maxScore: Number(s.maxScore ?? 100),
          passMark: Number(s.maxScore ?? 100) * 0.5,
          status: Number(s.score) >= Number(s.maxScore ?? 100) * 0.5 ? 'pass' : 'fail',
          orderIdx: idx,
        })
      )

      const stats = computeResultStats(subjects)

      await prisma.result.create({
        data: {
          semesterId: semester.id,
          seatNumber: String(r.seatNumber),
          nameAr: r.nameAr,
          nameEn: r.nameEn ?? '',
          gradeAr: r.gradeAr,
          gradeEn: r.gradeEn ?? '',
          dateOfBirth: r.dateOfBirth ?? null,
          ...stats,
          subjects: { create: subjects },
        },
      })
    }

    return NextResponse.json({ success: true, semesterId: semester.id })
  } catch (err) {
    console.error('[semesters POST]', err)
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
  }
}
