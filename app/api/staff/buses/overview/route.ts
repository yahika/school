import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [buses, totalRiders, riderGradeRows] = await Promise.all([
    prisma.bus.findMany({ include: { _count: { select: { riders: { where: { isActive: true } } } } }, orderBy: { code: 'asc' } }),
    prisma.busRider.count({ where: { isActive: true } }),
    prisma.busRider.findMany({ where: { isActive: true }, select: { gradeAr: true } }),
  ])

  const byStatus: Record<string, number> = { active: 0, maintenance: 0, inactive: 0 }
  let totalCapacity = 0
  for (const b of buses) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
    totalCapacity += b.capacity
  }

  const byGrade: Record<string, number> = {}
  for (const r of riderGradeRows) byGrade[r.gradeAr] = (byGrade[r.gradeAr] ?? 0) + 1
  const gradeBreakdown = Object.entries(byGrade).map(([gradeAr, count]) => ({ gradeAr, count })).sort((a, b) => a.gradeAr.localeCompare(b.gradeAr, 'ar'))

  const fleet = buses.map(b => ({
    id: b.id, code: b.code, driverName: b.driverName, routeAr: b.routeAr, status: b.status,
    capacity: b.capacity, riderCount: b._count.riders,
  }))

  return NextResponse.json({
    totalBuses: buses.length,
    byStatus,
    totalRiders,
    totalCapacity,
    utilization: totalCapacity > 0 ? Math.round((totalRiders / totalCapacity) * 100) : 0,
    gradeBreakdown,
    fleet,
  })
}
