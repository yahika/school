import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/owner/analytics
// Business intelligence data for the owner: monthly revenue/expenses,
// expense breakdown by category, cost per student, profit margin, asset value.
export async function GET() {
  try {
    const now = new Date()

    // ── Last 6 calendar months ────────────────────────────────────────────────
    const months: { label: string; labelAr: string; year: number; month: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        labelAr: d.toLocaleString('ar-EG', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      })
    }

    const [paidFees, expenses, activeStudents, invItems, buses] = await Promise.all([
      prisma.feeRecord.findMany({ where: { isPaid: true, paidAt: { not: null } }, select: { amount: true, paidAt: true } }),
      prisma.expense.findMany({ select: { amount: true, category: true, date: true } }),
      prisma.studentFile.count({ where: { status: 'active' } }),
      prisma.inventoryItem.findMany({ select: { quantity: true, unitPrice: true, minThreshold: true } }),
      prisma.bus.findMany({ select: { status: true } }),
    ])

    // ── Monthly revenue (from fee paidAt) ─────────────────────────────────────
    const monthlyRevenue = months.map(m => {
      const total = paidFees
        .filter(f => {
          const d = f.paidAt!
          return d.getFullYear() === m.year && d.getMonth() + 1 === m.month
        })
        .reduce((s, f) => s + f.amount, 0)
      return { ...m, revenue: total }
    })

    // ── Monthly expenses (date stored as "YYYY-MM-DD" string) ─────────────────
    const monthlyExpenses = months.map(m => {
      const prefix = `${m.year}-${String(m.month).padStart(2, '0')}`
      const total = expenses
        .filter(e => e.date.startsWith(prefix))
        .reduce((s, e) => s + e.amount, 0)
      return { ...m, expenses: total }
    })

    // ── Expense breakdown by category ─────────────────────────────────────────
    const catMap: Record<string, number> = {}
    for (const e of expenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
    }
    const expenseBreakdown = Object.entries(catMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalRevenue  = paidFees.reduce((s, f) => s + f.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit     = totalRevenue - totalExpenses
    const profitMargin  = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0
    const costPerStudent = activeStudents > 0 ? Math.round(totalExpenses / activeStudents) : 0

    // ── Asset value — inventory + rough bus fleet estimate ────────────────────
    const inventoryValue = invItems.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0)
    const activeBuses   = buses.filter(b => b.status === 'active').length
    const busFleetValue = activeBuses * 350_000  // estimated 350k EGP per bus
    const totalAssets   = inventoryValue + busFleetValue

    // ── Business health score (0–100) ─────────────────────────────────────────
    // 40pts: profit margin (capped at 40% → 100pts scale)
    // 30pts: collection rate (from fee records above)
    const totalExpected = await prisma.feeRecord.aggregate({ _sum: { amount: true } }).then(r => r._sum.amount ?? 0)
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0
    const marginScore = Math.min(40, Math.max(0, profitMargin) / 40 * 40)
    const collectionScore = (collectionRate / 100) * 30
    // 30pts: no low-stock items (lose 5 per item, floor 0)
    const lowStockCount = invItems.filter(i => i.quantity <= i.minThreshold).length
    const inventoryScore = Math.max(0, 30 - lowStockCount * 5)
    const healthScore = Math.round(marginScore + collectionScore + inventoryScore)

    return NextResponse.json({
      generatedAt: now.toISOString(),
      monthly: months.map((m, i) => ({
        label: m.label,
        labelAr: m.labelAr,
        revenue: monthlyRevenue[i].revenue,
        expenses: monthlyExpenses[i].expenses,
        profit: monthlyRevenue[i].revenue - monthlyExpenses[i].expenses,
      })),
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        profitMargin,
        costPerStudent,
        collectionRate: Math.round(collectionRate),
      },
      expenseBreakdown,
      assets: {
        inventoryValue,
        busFleetValue,
        totalAssets,
        activeBuses,
      },
      healthScore,
    })
  } catch (err) {
    console.error('[owner/analytics GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
