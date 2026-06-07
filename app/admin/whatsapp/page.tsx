'use client'
import { useState } from 'react'

const STEPS = [
  {
    num: '١',
    title: 'سجّل في UltraMsg',
    body: 'ادخل على ultramsg.com وأنشئ حساباً مجانياً. بعد التسجيل، أنشئ "Instance" جديد.',
    link: 'https://ultramsg.com',
    linkLabel: 'افتح UltraMsg ←',
  },
  {
    num: '٢',
    title: 'اربط رقم واتساب الأكاديمية',
    body: 'في لوحة UltraMsg، اضغط على الـ Instance ثم امسح QR Code بتطبيق واتساب على هاتف الأكاديمية. الهاتف يبقى متصلاً والبوت يرد تلقائياً.',
  },
  {
    num: '٣',
    title: 'احفظ بيانات الـ Instance',
    body: 'من لوحة UltraMsg، انسخ Instance ID و Token واضفهم لملف .env (انظر الأسفل).',
  },
  {
    num: '٤',
    title: 'أضف رابط الـ Webhook',
    body: 'في إعدادات الـ Instance، في حقل "Webhooks → Message Received" الصق رابط الـ webhook الخاص بك من الأسفل.',
  },
  {
    num: '٥',
    title: 'انشر واختبر',
    body: 'ادفع التغييرات لـ Vercel وانتظر حتى تنتشر. ثم أرسل رقم جلوس طالب على واتساب لرقم الأكاديمية وسيرد البوت فوراً.',
  },
]

export default function WhatsAppAdmin() {
  const [copied, setCopied] = useState(false)
  const [testSeat, setTestSeat] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState(false)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '/api/whatsapp/webhook'

  function copy() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  async function testBot() {
    const seat = testSeat.trim()
    if (!seat) return
    setTesting(true)
    setTestResult(null)
    setTestError(false)

    try {
      // Simulate an UltraMsg webhook payload
      const payload = {
        event_type: 'message_received',
        data: { from: '201234567890@c.us', body: seat, type: 'chat' },
      }
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.error) { setTestError(true); setTestResult('خطأ في الخادم') }
      else setTestResult('✅ تم إرسال الرد عبر واتساب\n(تحقق من هاتف الأكاديمية)')
    } catch {
      setTestError(true)
      setTestResult('❌ تعذّر الوصول للخادم')
    } finally {
      setTesting(false)
    }
  }

  // Dry-run test: look up result directly without sending WhatsApp
  async function previewBot() {
    const seat = testSeat.trim()
    if (!seat) return
    setTesting(true)
    setTestResult(null)
    setTestError(false)

    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(seat)}`)
      if (!res.ok) { setTestError(true); setTestResult(`لا توجد نتيجة لرقم الجلوس ${seat}`); return }
      const d = await res.json()
      const r = d.results?.[0]
      if (!r) { setTestError(true); setTestResult('لا توجد نتائج منشورة لهذا الطالب'); return }
      setTestResult(
        `👤 ${r.nameAr ?? ''}\n🪑 ${seat}\n📅 ${r.semester?.nameAr ?? ''}\n📈 ${r.totalScore}/${r.maxScore} (${r.percentage}%)\n${r.status === 'pass' ? '✅ ناجح' : '❌ راسب'}`
      )
    } catch {
      setTestError(true); setTestResult('خطأ في الاتصال')
    } finally { setTesting(false) }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>💬 بوت واتساب النتائج</h1>
      </div>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', borderRadius: '16px', padding: '28px', marginBottom: '28px', color: 'white' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🤖</div>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '8px' }}>بوت الاستعلام عن النتائج عبر واتساب</div>
        <div style={{ opacity: 0.85, fontSize: '0.88rem', lineHeight: 1.8 }}>
          ولي الأمر يرسل رقم الجلوس → البوت يرد بالنتيجة كاملة فوراً<br/>
          يعمل على رقمك الحقيقي · لا حاجة لأي موافقة · مجاني للبدء
        </div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['✅ بدون تكلفة للبداية', '📱 رقمك الحقيقي', '🚀 ردود فورية', '🌙 يعمل 24/7'].map(b => (
            <span key={b} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, color: '#0a5c36', marginBottom: '10px' }}>🔗 رابط الـ Webhook</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <code style={{ flex: 1, background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: '#0f172a', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left' }}>
            {webhookUrl}
          </code>
          <button onClick={copy} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: copied ? '#0a5c36' : '#f1f5f9', color: copied ? 'white' : '#0f172a', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {copied ? '✅ تم النسخ' : '📋 نسخ'}
          </button>
        </div>
        <div style={{ marginTop: '8px', color: '#64748b', fontSize: '0.78rem' }}>
          الصق هذا الرابط في حقل "Webhook URL" في إعدادات UltraMsg Instance
        </div>
      </div>

      {/* Preview / test */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
        <div style={{ fontWeight: 700, color: '#0a5c36', marginBottom: '12px' }}>🔍 معاينة رد البوت لأي رقم جلوس</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            value={testSeat}
            onChange={e => setTestSeat(e.target.value)}
            placeholder="أدخل رقم جلوس..."
            style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '0.9rem' }}
            onKeyDown={e => e.key === 'Enter' && previewBot()}
          />
          <button onClick={previewBot} disabled={testing || !testSeat.trim()} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#0a5c36', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, opacity: testing || !testSeat.trim() ? 0.6 : 1 }}>
            {testing ? '...' : 'معاينة'}
          </button>
        </div>
        {testResult && (
          <div style={{ background: testError ? '#fef2f2' : '#f0fdf4', borderRadius: '10px', padding: '16px', border: `1px solid ${testError ? '#fca5a5' : '#bbf7d0'}` }}>
            <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', marginBottom: '8px' }}>📱 ما سيصل لولي الأمر على واتساب:</div>
            <pre style={{ margin: 0, fontFamily: 'Tajawal,sans-serif', fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#0f172a' }}>{testResult}</pre>
          </div>
        )}
      </div>

      {/* Steps */}
      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '16px' }}>📋 خطوات الإعداد</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0a5c36', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
              {step.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{step.title}</div>
              <div style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.6 }}>{step.body}</div>
              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '7px', color: '#0a5c36', fontWeight: 600, fontSize: '0.81rem', textDecoration: 'none' }}>
                  {step.linkLabel}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Env vars code block */}
      <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 2 }}>
        <div style={{ color: '#94a3b8', marginBottom: '6px', fontFamily: 'Tajawal,sans-serif', fontSize: '0.78rem' }}># أضف هذه المتغيرات لملف .env</div>
        <div><span style={{ color: '#7dd3fc' }}>ULTRAMSG_INSTANCE</span>=<span style={{ color: '#86efac' }}>instance12345</span></div>
        <div><span style={{ color: '#7dd3fc' }}>ULTRAMSG_TOKEN</span>=<span style={{ color: '#86efac' }}>your_ultramsg_token_here</span></div>
        <div><span style={{ color: '#7dd3fc' }}>NEXT_PUBLIC_APP_URL</span>=<span style={{ color: '#86efac' }}>https://your-domain.vercel.app</span></div>
      </div>
    </div>
  )
}
