import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Read-only log of online payment transactions (Paymob), for audit/reconciliation.
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const status = req.nextUrl.searchParams.get('status')?.trim()

  const payments = await prisma.payment.findMany({
    where: {
      ...(search ? { OR: [
        { seatNumber: { contains: search } },
        { specialReference: { contains: search } },
        { feeRecord: { studentName: { contains: search } } },
      ] } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { feeRecord: { select: { studentName: true, gradeAr: true, academicYear: true } } },
  })

  return NextResponse.json({
    payments: payments.map(p => ({
      id: p.id,
      studentName: p.feeRecord?.studentName ?? null,
      gradeAr: p.feeRecord?.gradeAr ?? null,
      academicYear: p.feeRecord?.academicYear ?? null,
      seatNumber: p.seatNumber,
      amount: p.amountCents / 100,
      currency: p.currency,
      status: p.status,
      specialReference: p.specialReference,
      paymobTransactionId: p.paymobTransactionId,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
  })
}
