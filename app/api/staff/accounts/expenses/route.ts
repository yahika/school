import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

export const EXPENSE_CATEGORIES = ['رواتب', 'مرافق', 'صيانة', 'مستلزمات', 'مواصلات', 'أخرى']

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const category = req.nextUrl.searchParams.get('category')?.trim()
  const from = req.nextUrl.searchParams.get('from')?.trim()
  const to = req.nextUrl.searchParams.get('to')?.trim()

  const expenses = await prisma.expense.findMany({
    where: {
      ...(search ? { OR: [{ description: { contains: search } }, { paidTo: { contains: search } }] } : {}),
      ...(category ? { category } : {}),
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ expenses, categories: EXPENSE_CATEGORIES })
}

export async function POST(req: NextRequest) {
  try {
    const staff = await getStaffFromCookies()
    const b = await req.json()
    if (!b.date?.trim() || !b.category?.trim() || !b.description?.trim() || !b.amount) {
      return NextResponse.json({ error: 'التاريخ والفئة والوصف والمبلغ حقول مطلوبة' }, { status: 400 })
    }
    const amount = Number(b.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 })

    const expense = await prisma.expense.create({
      data: {
        date: b.date.trim(),
        category: b.category.trim(),
        description: b.description.trim(),
        amount,
        paidTo: b.paidTo?.trim() || null,
        notes: b.notes?.trim() || null,
        recordedBy: staff?.name ?? null,
      },
    })
    return NextResponse.json({ success: true, expense })
  } catch (err) {
    console.error('[staff/accounts/expenses POST]', err)
    return NextResponse.json({ error: 'تعذّر إضافة المصروف' }, { status: 500 })
  }
}
