import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jwtVerify } from 'jose'
import { createPaymentIntention, generateSpecialReference, isPaymobConfigured } from '@/lib/paymob'

export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')

/** Starts an online payment for one fee record and returns a Paymob checkout URL to redirect to. */
export async function POST(req: NextRequest) {
  try {
    if (!isPaymobConfigured())
      return NextResponse.json({ error: 'الدفع الإلكتروني غير مُفعّل حالياً — يرجى التواصل مع الإدارة' }, { status: 503 })

    const token = req.cookies.get('parent_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload } = await jwtVerify(token, secret)
    const parent = await prisma.parentAccount.findUnique({ where: { id: payload.parentId as number } })
    if (!parent || !parent.isActive)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { feeRecordId } = await req.json()
    if (!feeRecordId) return NextResponse.json({ error: 'رقم سجل المصروفات مطلوب' }, { status: 400 })

    // Only allow paying a fee that belongs to *this* parent's child
    const fee = await prisma.feeRecord.findUnique({ where: { id: Number(feeRecordId) } })
    if (!fee || fee.seatNumber !== parent.seatNumber)
      return NextResponse.json({ error: 'سجل المصروفات غير موجود' }, { status: 404 })
    if (fee.isPaid)
      return NextResponse.json({ error: 'هذه المصروفات مدفوعة بالفعل' }, { status: 409 })

    const amountCents = Math.round(fee.amount * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      return NextResponse.json({ error: 'قيمة غير صالحة' }, { status: 400 })

    const specialReference = generateSpecialReference(`fee${fee.id}`)
    const [firstName, ...rest] = (parent.name || '').trim().split(/\s+/).filter(Boolean)

    const intention = await createPaymentIntention({
      amountCents,
      specialReference,
      description: `School fees - ${fee.studentName} (${fee.academicYear})`,
      billing: {
        firstName: firstName || 'Parent',
        lastName: rest.join(' ') || 'Guardian',
        email: parent.email,
        phone: parent.phone || '+201000000000',
      },
      extras: { feeRecordId: fee.id, parentId: parent.id, seatNumber: parent.seatNumber },
    })

    await prisma.payment.create({
      data: {
        feeRecordId: fee.id,
        parentAccountId: parent.id,
        seatNumber: parent.seatNumber,
        amountCents,
        currency: 'EGP',
        status: 'pending',
        specialReference,
        paymobOrderId: intention.paymobOrderId,
      },
    })

    return NextResponse.json({ checkoutUrl: intention.checkoutUrl })
  } catch (err) {
    console.error('Create payment error:', err)
    return NextResponse.json({ error: 'تعذر بدء عملية الدفع — حاول مرة أخرى لاحقاً' }, { status: 500 })
  }
}
