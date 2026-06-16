import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

// GET /api/staff/principal/overview
// Live operational snapshot for the school principal — today-centric data
// covering attendance, buses, finance, conduct, inventory, results, and applications.
export async function GET() {
  const staff = await getStaffFromCookies()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (staff.department !== 'principal' && staff.department !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [
    attendanceGroups,
    totalActiveStudents,
    attendanceTaken,
    buses,
    riderCounts,
    conductRecent,
    pendingApplicationCount,
    feePaid,
    feeUnpaid,
    allInventory,
    pendingReviewCount,
    latestSemester,
    monthExpenses,
    recentPayments,
    gradeBreakdown,
  ] = await Promise.all([
    // attendance breakdown for today
    prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { date: today },
      _count: { id: true },
    }),
    // total active students (denominator for attendance rate)
    prisma.studentFile.count({ where: { status: 'active' } }),
    // whether anyone has submitted attendance today at all
    prisma.attendanceRecord.count({ where: { date: today } }),
    // all buses with basic info
    prisma.bus.findMany({
      select: { id: true, code: true, status: true, driverName: true, routeAr: true, capacity: true },
      orderBy: { code: 'asc' },
    }),
    // active rider count per bus
    prisma.busRider.groupBy({
      by: ['busId'],
      where: { isActive: true },
      _count: { id: true },
    }),
    // conduct notes from last 7 days
    prisma.conductNote.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    // pending enrollment applications
    prisma.application.count({ where: { status: 'pending' } }),
    // paid fees aggregate
    prisma.feeRecord.aggregate({
      where: { isPaid: true },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // unpaid fees aggregate
    prisma.feeRecord.aggregate({
      where: { isPaid: false },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // all inventory for low-stock filtering
    prisma.inventoryItem.findMany({
      select: { id: true, nameAr: true, category: true, quantity: true, unit: true, minThreshold: true },
    }),
    // results control: pending reviews
    prisma.resultReview.count({ where: { status: 'pending' } }),
    // most recently published semester
    prisma.semester.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: { nameAr: true, academicYear: true, publishedAt: true },
    }),
    // expenses this month
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // last 5 fee payments received
    prisma.feeRecord.findMany({
      where: { isPaid: true, paidAt: { not: null } },
      orderBy: { paidAt: 'desc' },
      take: 5,
      select: { studentName: true, gradeAr: true, amount: true, paidAt: true },
    }),
    // student count per grade for header insight
    prisma.studentFile.groupBy({
      by: ['gradeAr'],
      where: { status: 'active' },
      _count: { id: true },
      orderBy: { gradeAr: 'asc' },
    }),
  ])

  // ── Attendance summary ────────────────────────────────────────────────────
  const attMap: Record<string, number> = {}
  for (const g of attendanceGroups) attMap[g.status] = g._count.id
  const presentCount = attMap['present'] ?? 0
  const absentCount = attMap['absent'] ?? 0
  const lateCount = attMap['late'] ?? 0
  const excusedCount = attMap['excused'] ?? 0
  const totalMarked = presentCount + absentCount + lateCount + excusedCount
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null

  // ── Buses ─────────────────────────────────────────────────────────────────
  const riderMap: Record<number, number> = {}
  for (const r of riderCounts) riderMap[r.busId] = r._count.id
  const busesWithRiders = buses.map(b => ({ ...b, riderCount: riderMap[b.id] ?? 0 }))
  const activeBuses = busesWithRiders.filter(b => b.status === 'active').length
  const maintenanceBuses = busesWithRiders.filter(b => b.status === 'maintenance').length

  // ── Low stock ─────────────────────────────────────────────────────────────
  const lowStockItems = allInventory
    .filter(i => i.quantity <= i.minThreshold)
    .slice(0, 8)

  // ── Finance ───────────────────────────────────────────────────────────────
  const collected = feePaid._sum.amount ?? 0
  const outstanding = feeUnpaid._sum.amount ?? 0
  const totalExpected = collected + outstanding
  const collectionRate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0
  const overdueCount = feeUnpaid._count.id

  // ── Alert count (badge for principal) ────────────────────────────────────
  const totalAlerts =
    pendingApplicationCount +
    lowStockItems.length +
    pendingReviewCount +
    (absentCount > 0 ? 1 : 0)

  return NextResponse.json({
    generatedAt: now.toISOString(),
    today,
    totalActiveStudents,
    attendance: {
      taken: attendanceTaken > 0,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      totalMarked,
      rate: attendanceRate,
    },
    buses: busesWithRiders,
    busStats: { total: buses.length, active: activeBuses, maintenance: maintenanceBuses },
    conduct: {
      recent: conductRecent,
      negativeCount: conductRecent.filter(c => c.type === 'negative').length,
      positiveCount: conductRecent.filter(c => c.type === 'positive').length,
    },
    finance: {
      collected,
      outstanding,
      totalExpected,
      collectionRate,
      overdueCount,
      monthExpenses: monthExpenses._sum.amount ?? 0,
      monthExpenseCount: monthExpenses._count.id,
      recentPayments,
    },
    inventory: { lowStockItems, lowStockCount: lowStockItems.length },
    results: {
      pendingReviewCount,
      latestSemester,
    },
    applications: { pendingCount: pendingApplicationCount },
    gradeBreakdown: gradeBreakdown.map(g => ({ gradeAr: g.gradeAr, count: g._count.id })),
    alerts: totalAlerts,
  })
}
