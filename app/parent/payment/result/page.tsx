'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Outcome = 'success' | 'pending' | 'failed' | 'unknown'

/**
 * Where Paymob's Unified Checkout sends the parent back to after they finish
 * (or abandon) a payment. The query string Paymob appends here (`success`,
 * `pending`, …) is read ONLY for immediate, friendly feedback — it is never
 * trusted to actually mark anything as paid. That happens server-to-server via
 * the HMAC-verified webhook (app/api/payments/webhook), which is the sole
 * source of truth for fee status. Worst case if someone hand-edits this URL:
 * they see an optimistic message, but their fees page still correctly shows
 * "unpaid" until a real, verified payment lands.
 */
export default function PaymentResultPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const isRtl = lang === 'ar'
  const [outcome, setOutcome] = useState<Outcome>('unknown')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as 'ar' | 'en' | null
    if (stored) setLang(stored)

    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const pending = params.get('pending')
    setOutcome(
      success === 'true' ? 'success'
      : pending === 'true' ? 'pending'
      : success === 'false' ? 'failed'
      : 'unknown'
    )
  }, [])

  const content: Record<Outcome, { icon: string; title: string; body: string; color: string }> = {
    success: {
      icon: '✅',
      color: '#16a34a',
      title: isRtl ? 'تم الدفع بنجاح' : 'Payment successful',
      body: isRtl
        ? 'شكراً لك — تم استلام دفعتك. سيتم تحديث حالة السداد في صفحة المصاريف خلال لحظات.'
        : 'Thank you — your payment was received. Your fee status will update in a few moments.',
    },
    pending: {
      icon: '⏳',
      color: '#d97706',
      title: isRtl ? 'الدفع قيد المعالجة' : 'Payment is processing',
      body: isRtl
        ? 'جارِ تأكيد عملية الدفع من البنك. تحقق من صفحة المصاريف بعد قليل لمعرفة النتيجة النهائية.'
        : "Your bank is still confirming this payment. Check the Fees page again shortly for the final result.",
    },
    failed: {
      icon: '❌',
      color: '#dc2626',
      title: isRtl ? 'لم تكتمل عملية الدفع' : "Payment didn't go through",
      body: isRtl
        ? 'لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى في أي وقت من صفحة المصاريف.'
        : 'No amount was charged. You can try again any time from the Fees page.',
    },
    unknown: {
      icon: 'ℹ️',
      color: '#475569',
      title: isRtl ? 'تم العودة من صفحة الدفع' : 'Returned from checkout',
      body: isRtl
        ? 'تحقق من صفحة المصاريف في بوابتك لمعرفة آخر تحديث لحالة السداد.'
        : 'Check the Fees page in your portal for the latest status on your payment.',
    },
  }
  const c = content[outcome]

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif', padding: '24px' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px 32px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{c.icon}</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color, marginBottom: '12px' }}>{c.title}</h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '28px' }}>{c.body}</p>
        <button
          onClick={() => router.push('/parent/dashboard')}
          style={{ background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {isRtl ? 'الذهاب إلى لوحة التحكم' : 'Go to dashboard'}
        </button>
      </div>
    </div>
  )
}
