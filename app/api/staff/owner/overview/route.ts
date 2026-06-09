import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEPARTMENTS } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

// GET /api/staff/owner/overview
// One cross-department snapshot for the school owner — every department's
// headline numbers in a single live read. Read-only: the owner views, never edits.
export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalStudents, activeStudents, newThisMonth, gradeRows,
      buses, totalRiders,
      fees, expenses,
      invItems,
      staffRows,
      semesters, pendingReviews,
    ] = await Promise.all([
      prisma.studentFile.count(),
      prisma.studentFile.count({ where: { status: 'active' } }),
      prisma.studentFile.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.studentFile.findMany({ where: { status: 'active' }, select: { gradeAr: true } }),
      prisma.bus.findMany({ select: { capacity: true, status: true } }),
      prisma.busRider.count({ where: { isActive: true } }),
      prisma.feeRecord.findMany({ select: { amount: true, isPaid: true } }),
      prisma.expense.findMany({ select: { amount: true } }),
      prisma.inventoryItem.findMany({ select: { quantity: true, minThreshold: true, unitPrice: true } }),
      prisma.staff.findMany({ select: { department: true, isActive: true } }),
      prisma.semester.findMany({ select: { isPublished: true } }),
      prisma.resultReview.count({ where: { status: 'pending' } }),
    ])

    // ── Students by grade ──
    const byGrade: Record<string, number> = {}
    for (const r of gradeRows) byGrade[r.gradeAr] = (byGrade[r.gradeAr] ?? 0) + 1
    const gradeBreakdown = Object.entries(byGrade)
      .map(([gradeAr, count]) => ({ gradeAr, count }))
      .sort((a, b) => a.gradeAr.localeCompare(b.gradeAr, 'ar'))

    // ── Buses & riders ──
    let totalCapacity = 0
    const busStatus: Record<string, number> = { active: 0, maintenance: 0, inactive: 0 }
    for (const b of buses) {
      totalCapacity += b.capacity
      busStatus[b.status] = (busStatus[b.status] ?? 0) + 1
    }

    // ── Money in vs. out ──
    let totalExpected = 0, totalCollected = 0
    for (const f of fees) {
      totalExpected += f.amount
      if (f.isPaid) totalCollected += f.amount
    }
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    // ── Inventory ──
    const lowStockCount = invItems.filter(i => i.quantity <= i.minThreshold).length
    const inventoryValue = invItems.reduce((s, i) => s + (i.unitPrice ? i.unitPrice * i.quantity : 0), 0)

    // ── Staff headcount per department (the owner account itself is excluded) ──
    const staffByDept: Record<string, number> = {}
    let activeStaffCount = 0
    let totalStaffCount = 0
    for (const s of staffRows) {
      if (s.department === 'owner') continue
      totalStaffCount++
      staffByDept[s.department] = (staffByDept[s.department] ?? 0) + 1
      if (s.isActive) activeStaffCount++
    }
    const staffBreakdown = DEPARTMENTS.filter(d => d.value !== 'owner').map(d => ({
      department: d.value,
      labelAr: d.labelAr,
      icon: d.icon,
      count: staffByDept[d.value] ?? 0,
    }))

    return NextResponse.json({
      generatedAt: now.toISOString(),
      students: {
        total: totalStudents,
        active: activeStudents,
        newThisMonth,
        gradeBreakdown,
      },
      buses: {
        totalBuses: buses.length,
        totalRiders,
        totalCapacity,
        utilization: totalCapacity > 0 ? Math.round((totalRiders / totalCapacity) * 100) : 0,
        byStatus: busStatus,
      },
      finance: {
        totalCollected,
        totalExpected,
        totalExpenses,
        netBalance: totalCollected - totalExpenses,
        outstanding: totalExpected - totalCollected,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      },
      inventory: {
        totalItems: invItems.length,
        lowStockCount,
        estimatedValue: inventoryValue,
      },
      staff: {
        total: totalStaffCount,
        active: activeStaffCount,
        byDepartment: staffBreakdown,
      },
      results: {
        totalSemesters: semesters.length,
        published: semesters.filter(s => s.isPublished).length,
        pendingReviews,
      },
    })
  } catch (err) {
    console.error('[staff/owner/overview GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
