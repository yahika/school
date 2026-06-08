import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'
import { verifyPaymobHmac } from '@/lib/paymob'

export const dynamic = 'force-dynamic'

/**
 * Server-to-server callback Paymob calls after every transaction attempt.
 * Configure this exact URL as the integration's "Transaction processed callback":
 *   https://<your-domain>/api/payments/webhook
 *
 * Security: every payload is verified with HMAC-SHA512 (lib/paymob.ts) — anything
 * that doesn't match the integration's HMAC secret is rejected outright. This
 * webhook is the ONLY place a Payment/FeeRecord is ever marked as paid; the
 * browser-side return redirect is purely cosmetic feedback and is never trusted
 * for that purpose (a user could fake query params on that URL).
 */
export async function POST(req: NextRequest) {
  try {
    const hmac = req.nextUrl.searchParams.get('hmac')
    const body = await req.json().catch(() => null)
    const obj = (body?.obj ?? body) as Record<string, unknown> | null

    // Ignore callbacks that aren't transaction payloads (e.g. saved-card TOKEN callbacks)
    if (!obj || obj.id == null || obj.success === undefined) {
      return NextResponse.json({ received: true })
    }

    if (!verifyPaymobHmac(obj, hmac)) {
      console.error('Paymob webhook: HMAC verification failed for transaction', obj.id)
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }

    const payment = await findPaymentForTransaction(obj)
    if (!payment) {
      console.error('Paymob webhook: no matching Payment found for transaction', obj.id)
      return NextResponse.json({ received: true })
    }

    const success = toBool(obj.success)
    const pending = toBool(obj.pending)
    const status = success ? 'success' : pending ? 'pending' : 'failed'

    // Already recorded as successful — ack without redoing work or re-sending the receipt
    if (payment.status === 'success') {
      return NextResponse.json({ received: true })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paymobTransactionId: String(obj.id),
        rawCallback: safeJson(obj),
        paidAt: success ? new Date() : payment.paidAt,
      },
    })

    if (success) {
      const fee = await prisma.feeRecord.update({
        where: { id: payment.feeRecordId },
        data: { isPaid: true, paidAt: new Date() },
      })
      await sendReceiptEmail(payment, fee)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Paymob webhook error:', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

// Paymob (and uptime checks) sometimes GET this URL just to confirm it's reachable
export async function GET() {
  return NextResponse.json({ ok: true })
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true'
}

function safeJson(obj: unknown): string {
  try { return JSON.stringify(obj).slice(0, 10000) } catch { return '' }
}

/** Matches an inbound transaction back to one of our Payment rows (by our reference, then Paymob's order id). */
async function findPaymentForTransaction(obj: Record<string, unknown>) {
  const order = (obj.order ?? {}) as Record<string, unknown>
  const merchantOrderId = (order.merchant_order_id ?? obj.merchant_order_id) as string | number | undefined
  const orderId = order.id as string | number | undefined

  if (merchantOrderId != null) {
    const byRef = await prisma.payment.findUnique({ where: { specialReference: String(merchantOrderId) } })
    if (byRef) return byRef
  }
  if (orderId != null) {
    const byOrder = await prisma.payment.findFirst({ where: { paymobOrderId: String(orderId) } })
    if (byOrder) return byOrder
  }
  return null
}

type ReceiptPayment = { amountCents: number; currency: string; specialReference: string; parentAccountId: number | null }
type ReceiptFee = { studentName: string; academicYear: string }

/** Best-effort payment receipt email — any failure here must never break the webhook ack. */
async function sendReceiptEmail(payment: ReceiptPayment, fee: ReceiptFee) {
  if (!payment.parentAccountId || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return
  try {
    const parent = await prisma.parentAccount.findUnique({ where: { id: payment.parentAccountId } })
    if (!parent?.email) return

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
    await transporter.sendMail({
      from: `"أكاديمية النخبة" <${process.env.GMAIL_USER}>`,
      to: parent.email,
      subject: `✅ تم استلام دفعتك — ${fee.studentName}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;padding:24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#0a5c36;margin:0 0 16px">✅ تم تأكيد الدفع بنجاح</h2>
        <div style="background:white;padding:20px;border-radius:10px;border:1px solid #e2e8f0">
          <p><strong>الطالب:</strong> ${fee.studentName}</p>
          <p><strong>العام الدراسي:</strong> ${fee.academicYear}</p>
          <p><strong>المبلغ المدفوع:</strong> ${(payment.amountCents / 100).toLocaleString()} ${payment.currency}</p>
          <p><strong>رقم العملية:</strong> ${payment.specialReference}</p>
        </div>
        <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px">شكراً لسداد المصروفات الدراسية — تم تحديث حالة السداد تلقائياً في بوابة أولياء الأمور.</p>
      </div>`,
    })
  } catch (e) { console.error('Receipt email failed:', e) }
}
