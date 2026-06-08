import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const [totalFiles, activeFiles, rosterRows, todayRecords, recentConduct, recentFiles] = await Promise.all([
    prisma.studentFile.count(),
    prisma.studentFile.count({ where: { status: 'active' } }),
    prisma.result.findMany({ orderBy: { createdAt: 'desc' }, distinct: ['seatNumber'], select: { gradeAr: true } }),
    prisma.attendanceRecord.findMany({ where: { date: today } }),
    prisma.conductNote.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.studentFile.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { seatNumber: true, nameAr: true, gradeAr: true, status: true, createdAt: true } }),
  ])

  const byGrade: Record<string, number> = {}
  for (const r of rosterRows) byGrade[r.gradeAr] = (byGrade[r.gradeAr] ?? 0) + 1
  const gradeBreakdown = Object.entries(byGrade).map(([gradeAr, count]) => ({ gradeAr, count })).sort((a, b) => a.gradeAr.localeCompare(b.gradeAr, 'ar'))

  const attendanceSummary = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const r of todayRecords) if (r.status in attendanceSummary) (attendanceSummary as Record<string, number>)[r.status]++

  return NextResponse.json({
    totalStudents: rosterRows.length,
    totalFiles,
    activeFiles,
    gradeBreakdown,
    today,
    attendanceSummary,
    attendanceTaken: todayRecords.length,
    recentConduct,
    recentFiles,
  })
}
