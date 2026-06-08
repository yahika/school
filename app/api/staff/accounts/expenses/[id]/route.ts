import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof b.date === 'string' && b.date.trim()) data.date = b.date.trim()
    if (typeof b.category === 'string' && b.category.trim()) data.category = b.category.trim()
    if (typeof b.description === 'string' && b.description.trim()) data.description = b.description.trim()
    if (typeof b.paidTo === 'string') data.paidTo = b.paidTo.trim() || null
    if (typeof b.notes === 'string') data.notes = b.notes.trim() || null
    if (b.amount !== undefined) {
      const amount = Number(b.amount)
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 })
      data.amount = amount
    }

    const expense = await prisma.expense.update({ where: { id }, data })
    return NextResponse.json({ success: true, expense })
  } catch (err) {
    console.error('[staff/accounts/expenses/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل المصروف' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/accounts/expenses/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف المصروف' }, { status: 500 })
  }
}
