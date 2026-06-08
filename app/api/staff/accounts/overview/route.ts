import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [fees, expenses, recentPayments, recentExpenses] = await Promise.all([
    prisma.feeRecord.findMany({ select: { amount: true, isPaid: true, gradeAr: true } }),
    prisma.expense.findMany({ select: { amount: true, category: true } }),
    prisma.payment.findMany({
      where: { status: 'success' },
      orderBy: { paidAt: 'desc' },
      take: 6,
      include: { feeRecord: { select: { studentName: true, gradeAr: true } } },
    }),
    prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 6 }),
  ])

  let totalExpected = 0, totalCollected = 0, paidCount = 0
  const byGrade: Record<string, { expected: number; collected: number; count: number }> = {}
  for (const f of fees) {
    totalExpected += f.amount
    if (f.isPaid) { totalCollected += f.amount; paidCount++ }
    byGrade[f.gradeAr] ??= { expected: 0, collected: 0, count: 0 }
    byGrade[f.gradeAr].expected += f.amount
    byGrade[f.gradeAr].count++
    if (f.isPaid) byGrade[f.gradeAr].collected += f.amount
  }
  const gradeBreakdown = Object.entries(byGrade)
    .map(([gradeAr, v]) => ({ gradeAr, ...v }))
    .sort((a, b) => a.gradeAr.localeCompare(b.gradeAr, 'ar'))

  let totalExpenses = 0
  const byCategory: Record<string, number> = {}
  for (const e of expenses) { totalExpenses += e.amount; byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount }
  const expenseBreakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return NextResponse.json({
    totalExpected,
    totalCollected,
    totalOutstanding: totalExpected - totalCollected,
    feeCount: fees.length,
    paidCount,
    unpaidCount: fees.length - paidCount,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    totalExpenses,
    netBalance: totalCollected - totalExpenses,
    gradeBreakdown,
    expenseBreakdown,
    recentPayments: recentPayments.map(p => ({
      id: p.id,
      studentName: p.feeRecord?.studentName ?? p.seatNumber,
      gradeAr: p.feeRecord?.gradeAr ?? null,
      amount: p.amountCents / 100,
      paidAt: p.paidAt,
    })),
    recentExpenses: recentExpenses.map(e => ({
      id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, paidTo: e.paidTo,
    })),
  })
}
