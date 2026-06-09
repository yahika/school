import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/student-affairs/students/bulk
// Body: { students: Array<{ seatNumber, nameAr, nameEn?, gradeAr, gradeEn?, guardianName?,
//          guardianPhone?, guardianRelation?, emergencyPhone?, address?, nationalId?,
//          dateOfBirth?, enrollDate?, medicalNotes?, notes?, status? }> }
// Returns: { created, updated, errors }
export async function POST(req: NextRequest) {
  try {
    const { students } = await req.json() as { students: Record<string, string>[] }
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }

    let created = 0, updated = 0
    const errors: string[] = []

    for (const s of students) {
      const seatNumber = String(s.seatNumber ?? '').trim()
      const nameAr     = String(s.nameAr ?? '').trim()
      const gradeAr    = String(s.gradeAr ?? '').trim()
      if (!seatNumber || !nameAr || !gradeAr) {
        errors.push(`صف مفقود البيانات: ${JSON.stringify(s)}`)
        continue
      }
      try {
        const data = {
          nameAr,
          nameEn:           s.nameEn      ? String(s.nameEn).trim()      : undefined,
          gradeAr,
          gradeEn:          s.gradeEn     ? String(s.gradeEn).trim()     : undefined,
          guardianName:     s.guardianName     ? String(s.guardianName).trim()     : undefined,
          guardianPhone:    s.guardianPhone    ? String(s.guardianPhone).trim()    : undefined,
          guardianRelation: s.guardianRelation ? String(s.guardianRelation).trim() : undefined,
          emergencyPhone:   s.emergencyPhone   ? String(s.emergencyPhone).trim()   : undefined,
          address:          s.address          ? String(s.address).trim()          : undefined,
          nationalId:       s.nationalId       ? String(s.nationalId).trim()       : undefined,
          dateOfBirth:      s.dateOfBirth      ? String(s.dateOfBirth).trim()      : undefined,
          enrollDate:       s.enrollDate       ? String(s.enrollDate).trim()       : undefined,
          medicalNotes:     s.medicalNotes     ? String(s.medicalNotes).trim()     : undefined,
          notes:            s.notes            ? String(s.notes).trim()            : undefined,
          status:           s.status           ? String(s.status).trim()           : 'active',
        }
        const existing = await prisma.studentFile.findUnique({ where: { seatNumber } })
        if (existing) {
          await prisma.studentFile.update({ where: { seatNumber }, data })
          updated++
        } else {
          await prisma.studentFile.create({ data: { seatNumber, ...data } })
          created++
        }
      } catch (e) {
        errors.push(`رقم جلوس ${seatNumber}: ${e instanceof Error ? e.message : 'خطأ'}`)
      }
    }

    return NextResponse.json({ created, updated, errors })
  } catch (err) {
    console.error('[students/bulk POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
