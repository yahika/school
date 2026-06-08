import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET ?search=&status=paid|unpaid&grade=&year=  → list fee records (same data parents/admin see)
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const status = req.nextUrl.searchParams.get('status')?.trim()
  const gradeAr = req.nextUrl.searchParams.get('grade')?.trim()
  const year = req.nextUrl.searchParams.get('year')?.trim()

  const fees = await prisma.feeRecord.findMany({
    where: {
      ...(search ? { OR: [{ studentName: { contains: search } }, { seatNumber: { contains: search } }] } : {}),
      ...(status === 'paid' ? { isPaid: true } : status === 'unpaid' ? { isPaid: false } : {}),
      ...(gradeAr ? { gradeAr } : {}),
      ...(year ? { academicYear: year } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { payments: { where: { status: 'success' } } } } },
  })

  return NextResponse.json({
    fees: fees.map(f => ({
      id: f.id, studentName: f.studentName, seatNumber: f.seatNumber, gradeAr: f.gradeAr,
      amount: f.amount, isPaid: f.isPaid, paidAt: f.paidAt, notes: f.notes, academicYear: f.academicYear,
      createdAt: f.createdAt, paymentCount: f._count.payments,
    })),
  })
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.studentName?.trim() || !b.gradeAr?.trim() || !b.amount || !b.academicYear?.trim()) {
      return NextResponse.json({ error: 'اسم الطالب والصف والمبلغ والعام الدراسي حقول مطلوبة' }, { status: 400 })
    }
    const amount = Number(b.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 })

    const fee = await prisma.feeRecord.create({
      data: {
        studentName: b.studentName.trim(),
        seatNumber: b.seatNumber?.trim() || null,
        gradeAr: b.gradeAr.trim(),
        amount,
        academicYear: b.academicYear.trim(),
        notes: b.notes?.trim() || null,
      },
    })
    return NextResponse.json({ success: true, fee })
  } catch (err) {
    console.error('[staff/accounts POST]', err)
    return NextResponse.json({ error: 'تعذّر إنشاء سجل الرسوم' }, { status: 500 })
  }
}
