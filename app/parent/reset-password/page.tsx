'use client'
import { useState } from 'react'

export default function ResetPassword() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const L = lang === 'ar'
    ? { title: 'إعادة تعيين كلمة المرور', subtitle: 'أدخل بريدك ورقم جلوس طفلك للتحقق من هويتك', email: 'البريد الإلكتروني *', seat: 'رقم جلوس الطالب *', newPass: 'كلمة المرور الجديدة *', btn: 'إعادة تعيين', ok: '✅ تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.', login: '← تسجيل الدخول', lang: 'English' }
    : { title: 'Reset Password', subtitle: 'Enter your email and student seat number to verify your identity', email: 'Email Address *', seat: 'Student Seat Number *', newPass: 'New Password *', btn: 'Reset Password', ok: '✅ Password changed successfully! You can now log in.', login: '← Login', lang: 'عربي' }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/parent/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, seatNumber, newPassword }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#041f12,#063d22 50%,#0a5c36)', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/">
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(200,151,43,0.4)' }}>AEA</div>
          </a>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 6px' }}>{L.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.85rem' }}>{L.subtitle}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '20px' }}>{L.ok}</div>
              <a href="/parent/login" style={{ display: 'inline-block', padding: '12px 28px', background: '#0a5c36', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>{L.login}</a>
            </div>
          ) : (
            <form onSubmit={submit}>
              {[
                { label: L.email, key: 'email', val: email, set: setEmail, type: 'email' },
                { label: L.seat, key: 'seat', val: seatNumber, set: setSeatNumber, type: 'text' },
                { label: L.newPass, key: 'pass', val: newPassword, set: setNewPassword, type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
                  <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              ))}
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '14px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                {loading ? '...' : `🔑 ${L.btn}`}
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a href="/parent/login" style={{ color: '#0a5c36', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>{L.login}</a>
              </div>
            </form>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>🌐 {L.lang}</button>
        </div>
      </div>
    </div>
  )
}
