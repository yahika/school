'use client'
import { useState } from 'react'

interface AppStatus { id: number; studentNameAr: string; gradeApplying: string; status: string; createdAt: string; parentEmail: string }

export default function ApplicationStatus() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [email, setEmail] = useState('')
  const [appId, setAppId] = useState('')
  const [result, setResult] = useState<AppStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const L = lang === 'ar'
    ? { title: 'تتبع طلب التسجيل', subtitle: 'أدخل بريدك الإلكتروني أو رقم الطلب للتحقق من الحالة', email: 'البريد الإلكتروني', or: 'أو', appId: 'رقم الطلب', btn: 'تحقق من الحالة', home: 'الرئيسية', apply: 'تقديم طلب جديد', lang: 'English', notFound: 'لم يتم العثور على طلب بهذه البيانات', pending: 'قيد المراجعة', accepted: 'مقبول ✅', rejected: 'مرفوض', student: 'اسم الطالب', grade: 'الصف', date: 'تاريخ التقديم', status: 'الحالة' }
    : { title: 'Track Your Application', subtitle: 'Enter your email or application number to check status', email: 'Email Address', or: 'or', appId: 'Application ID', btn: 'Check Status', home: 'Home', apply: 'Submit New Application', lang: 'عربي', notFound: 'No application found with these details', pending: 'Under Review', accepted: 'Accepted ✅', rejected: 'Rejected', student: 'Student Name', grade: 'Grade', date: 'Application Date', status: 'Status' }

  async function check(e: React.FormEvent) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true)
    try {
      const params = new URLSearchParams()
      if (email) params.set('email', email)
      if (appId) params.set('id', appId)
      const res = await fetch(`/api/apply/status?${params}`)
      const d = await res.json()
      if (!res.ok || !d.application) { setError(L.notFound); return }
      setResult(d.application)
    } catch { setError(L.notFound) }
    finally { setLoading(false) }
  }

  const statusColor = { pending: { bg: '#fef9c3', color: '#92400e' }, accepted: { bg: '#f0fdf4', color: '#15803d' }, rejected: { bg: '#fef2f2', color: '#dc2626' } }
  const statusLabel = { pending: L.pending, accepted: L.accepted, rejected: L.rejected }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#041f12,#063d22 50%,#0a5c36)', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/">
            <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'white', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(200,151,43,0.4)' }}>AEA</div>
          </a>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.6rem', margin: '0 0 8px' }}>{L.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>{L.subtitle}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
          <form onSubmit={check}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{L.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ textAlign: 'center', color: '#94a3b8', margin: '12px 0', fontSize: '0.85rem', fontWeight: 600 }}>— {L.or} —</div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{L.appId}</label>
              <input type="number" value={appId} onChange={e => setAppId(e.target.value)} placeholder="#" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            <button type="submit" disabled={loading || (!email && !appId)} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: (loading || (!email && !appId)) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (loading || (!email && !appId)) ? 0.6 : 1 }}>
              {loading ? '...' : `🔍 ${L.btn}`}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: '24px', background: '#f8fafc', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ padding: '8px 20px', borderRadius: '999px', fontWeight: 800, fontSize: '1rem', background: statusColor[result.status as keyof typeof statusColor]?.bg, color: statusColor[result.status as keyof typeof statusColor]?.color }}>
                  {statusLabel[result.status as keyof typeof statusLabel]}
                </span>
              </div>
              {[
                { label: L.student, value: result.studentNameAr },
                { label: L.grade, value: result.gradeApplying },
                { label: 'Application ID', value: `#${result.id}` },
                { label: L.date, value: new Date(result.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '0 4px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', textDecoration: 'none' }}>← {L.home}</a>
          <a href="/apply" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', textDecoration: 'none' }}>{L.apply} →</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>🌐 {L.lang}</button>
        </div>
      </div>
    </div>
  )
}
