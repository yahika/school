import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Looks up a seat number in the existing Results data so the "new file" form
// can auto-fill the student's name & grade instead of retyping them.
export async function GET(req: NextRequest) {
  const seat = req.nextUrl.searchParams.get('seat')?.trim()
  if (!seat) return NextResponse.json({ found: false })

  const result = await prisma.result.findFirst({
    where: { seatNumber: seat },
    orderBy: { createdAt: 'desc' },
    select: { seatNumber: true, nameAr: true, nameEn: true, gradeAr: true, gradeEn: true, dateOfBirth: true },
  })
  if (!result) return NextResponse.json({ found: false })

  const hasFile = await prisma.studentFile.findUnique({ where: { seatNumber: seat }, select: { id: true } })
  return NextResponse.json({ found: true, hasFile: !!hasFile, student: result })
}
