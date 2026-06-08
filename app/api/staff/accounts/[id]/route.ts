import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fee = await prisma.feeRecord.findUnique({
    where: { id: parseInt(params.id) },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  })
  if (!fee) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 })
  return NextResponse.json({ fee })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof b.studentName === 'string' && b.studentName.trim()) data.studentName = b.studentName.trim()
    if (typeof b.seatNumber === 'string') data.seatNumber = b.seatNumber.trim() || null
    if (typeof b.gradeAr === 'string' && b.gradeAr.trim()) data.gradeAr = b.gradeAr.trim()
    if (typeof b.academicYear === 'string' && b.academicYear.trim()) data.academicYear = b.academicYear.trim()
    if (typeof b.notes === 'string') data.notes = b.notes.trim() || null
    if (b.amount !== undefined) {
      const amount = Number(b.amount)
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 })
      data.amount = amount
    }
    if (typeof b.isPaid === 'boolean') {
      data.isPaid = b.isPaid
      data.paidAt = b.isPaid ? new Date() : null
    }

    const fee = await prisma.feeRecord.update({ where: { id }, data })
    return NextResponse.json({ success: true, fee })
  } catch (err) {
    console.error('[staff/accounts/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل سجل الرسوم' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.feeRecord.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/accounts/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف السجل' }, { status: 500 })
  }
}
