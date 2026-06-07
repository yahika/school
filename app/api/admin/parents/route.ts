import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const parents = await prisma.parentAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, phone: true, studentName: true, seatNumber: true, gradeAr: true, isActive: true, createdAt: true },
  })
  return NextResponse.json({ parents })
}
