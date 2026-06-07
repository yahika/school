import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Get all unique students from results
  const results = await prisma.result.findMany({
    orderBy: { createdAt: 'desc' },
    include: { semester: { select: { isPublished: true } } },
  })

  // Group by seatNumber
  const map = new Map<string, { seatNumber: string; nameAr: string; nameEn: string; gradeAr: string; totalResults: number; latestPct: number; latestStatus: string }>()
  for (const r of results) {
    if (!map.has(r.seatNumber)) {
      map.set(r.seatNumber, {
        seatNumber: r.seatNumber,
        nameAr: r.nameAr,
        nameEn: r.nameEn ?? '',
        gradeAr: r.gradeAr,
        totalResults: 0,
        latestPct: r.percentage,
        latestStatus: r.status,
      })
    }
    const s = map.get(r.seatNumber)!
    s.totalResults++
  }

  return NextResponse.json({ students: Array.from(map.values()) })
}
