import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Looks up a seat number in the existing Results data so the "add rider" form
// can auto-fill the student's name & grade instead of retyping them.
export async function GET(req: NextRequest) {
  const seat = req.nextUrl.searchParams.get('seat')?.trim()
  if (!seat) return NextResponse.json({ found: false })

  const result = await prisma.result.findFirst({
    where: { seatNumber: seat },
    orderBy: { createdAt: 'desc' },
    select: { seatNumber: true, nameAr: true, gradeAr: true },
  })
  if (!result) return NextResponse.json({ found: false })

  const onBus = await prisma.busRider.findFirst({
    where: { seatNumber: seat, isActive: true },
    select: { bus: { select: { code: true } } },
  })
  return NextResponse.json({ found: true, student: result, currentBusCode: onBus?.bus.code ?? null })
}
