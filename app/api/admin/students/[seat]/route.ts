import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { seat: string } }) {
  const results = await prisma.result.findMany({
    where: { seatNumber: params.seat },
    include: {
      semester: { select: { nameAr: true, nameEn: true, academicYear: true, term: true } },
      subjects: { orderBy: { orderIdx: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ results })
}
