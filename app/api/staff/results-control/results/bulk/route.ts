import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/results-control/results/bulk
// Body: { semesterId: number, results: Record<string, string>[] }
// Upserts Result records (no subjects — just top-level scores).
export async function POST(req: NextRequest) {
  try {
    const { semesterId, results } = await req.json() as {
      semesterId: number
      results: Record<string, string>[]
    }

    if (!semesterId || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'semesterId وقائمة النتائج مطلوبة' }, { status: 400 })
    }

    // Verify semester exists
    const semester = await prisma.semester.findUnique({ where: { id: semesterId } })
    if (!semester) return NextResponse.json({ error: 'الفصل الدراسي غير موجود' }, { status: 404 })

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let i = 0; i < results.length; i++) {
      const row = results[i]
      const seatNumber = row.seatNumber?.trim()
      const nameAr = row.nameAr?.trim()
      const gradeAr = row.gradeAr?.trim()
      const totalScore = parseFloat(row.totalScore)
      const maxScore = parseFloat(row.maxScore)

      if (!seatNumber || !nameAr || !gradeAr) {
        errors.push(`الصف ${i + 2}: رقم الجلوس والاسم والصف مطلوبة`)
        continue
      }
      if (isNaN(totalScore) || isNaN(maxScore) || maxScore <= 0) {
        errors.push(`الصف ${i + 2} (${seatNumber}): درجات غير صالحة`)
        continue
      }

      const percentage = Math.round((totalScore / maxScore) * 100)
      const status = row.status?.trim() === 'fail' ? 'fail' : (row.status?.trim() === 'pass' ? 'pass' : (percentage >= 50 ? 'pass' : 'fail'))
      const letterGrade = row.letterGrade?.trim() || null

      try {
        const existing = await prisma.result.findUnique({
          where: { semesterId_seatNumber: { semesterId, seatNumber } },
          select: { id: true },
        })
        if (existing) {
          await prisma.result.update({
            where: { id: existing.id },
            data: { nameAr, gradeAr, totalScore, maxScore, percentage, status, letterGrade },
          })
          updated++
        } else {
          await prisma.result.create({
            data: { semesterId, seatNumber, nameAr, gradeAr, totalScore, maxScore, percentage, status, letterGrade },
          })
          created++
        }
      } catch (err) {
        errors.push(`الصف ${i + 2} (${seatNumber}): ${err instanceof Error ? err.message : 'خطأ'}`)
      }
    }

    return NextResponse.json({ created, updated, errors })
  } catch (err) {
    console.error('[results/bulk POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
