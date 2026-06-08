import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/results-control/results?semesterId=&search=&status=&grade= — browse/search results within a semester
export async function GET(req: NextRequest) {
  const semesterIdRaw = req.nextUrl.searchParams.get('semesterId')
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const status = req.nextUrl.searchParams.get('status')?.trim()
  const gradeAr = req.nextUrl.searchParams.get('grade')?.trim()

  if (!semesterIdRaw) return NextResponse.json({ semester: null, results: [] })
  const semesterId = parseInt(semesterIdRaw)
  if (!Number.isFinite(semesterId)) return NextResponse.json({ error: 'فصل دراسي غير صحيح' }, { status: 400 })

  const [semester, results] = await Promise.all([
    prisma.semester.findUnique({
      where: { id: semesterId },
      select: { id: true, nameAr: true, nameEn: true, academicYear: true, term: true, isPublished: true },
    }),
    prisma.result.findMany({
      where: {
        semesterId,
        ...(search ? { OR: [{ nameAr: { contains: search } }, { nameEn: { contains: search } }, { seatNumber: { contains: search } }] } : {}),
        ...(status ? { status } : {}),
        ...(gradeAr ? { gradeAr } : {}),
      },
      orderBy: { seatNumber: 'asc' },
      take: 300,
      select: { id: true, seatNumber: true, nameAr: true, nameEn: true, gradeAr: true, gradeEn: true, totalScore: true, maxScore: true, percentage: true, status: true, letterGrade: true, rank: true },
    }),
  ])

  if (!semester) return NextResponse.json({ error: 'الفصل الدراسي غير موجود' }, { status: 404 })
  return NextResponse.json({ semester, results })
}
