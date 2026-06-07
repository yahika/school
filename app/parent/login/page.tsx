'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ParentLogin() {
  const router = useRouter()
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', phone: '', seatNumber: '' })

  const L = {
    ar: {
      title: 'بوابة أولياء الأمور', subtitle: 'تابع مسيرة طفلك الأكاديمية',
      login: 'تسجيل الدخول', register: 'حساب جديد',
      email: 'البريد الإلكتروني', password: 'كلمة المرور',
      name: 'الاسم الكامل', phone: 'رقم الهاتف', seat: 'رقم جلوس الطالب',
      seatHint: 'الرقم الموجود في كشف النتيجة',
      loginBtn: 'دخول', registerBtn: 'إنشاء حساب',
      noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟',
      forgot: 'نسيت كلمة المرور؟',
      home: 'الرئيسية', lang: 'English',
    },
    en: {
      title: 'Parent Portal', subtitle: 'Track your child\'s academic journey',
      login: 'Login', register: 'New Account',
      email: 'Email Address', password: 'Password',
      name: 'Full Name', phone: 'Phone Number', seat: 'Student Seat Number',
      seatHint: 'The number found on the result sheet',
      loginBtn: 'Sign In', registerBtn: 'Create Account',
      noAccount: 'Don\'t have an account?', hasAccount: 'Already have an account?',
      forgot: 'Forgot password?',
      home: 'Home', lang: 'عربي',
    },
  }[lang]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/parent/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      router.push('/parent/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ في تسجيل الدخول')
    } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/parent/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setSuccess(lang === 'ar' ? `✅ تم إنشاء الحساب بنجاح! مرحباً، طالبك: ${d.studentName}` : `✅ Account created! Student: ${d.studentName}`)
      setTab('login')
      setLoginForm({ email: regForm.email, password: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ في إنشاء الحساب')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#041f12 0%,#063d22 50%,#0a5c36 100%)', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`}</style>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', color: 'white', margin: '0 auto', boxShadow: '0 8px 24px rgba(200,151,43,0.4)' }}>AEA</div>
          </a>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.6rem', margin: '0 0 6px' }}>{L.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>{L.subtitle}</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '28px', gap: '4px' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{
                padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#0a5c36' : '#64748b',
                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
                {t === 'login' ? L.login : L.register}
              </button>
            ))}
          </div>

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '0.88rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              {[
                { label: L.email, key: 'email', type: 'email' },
                { label: L.password, key: 'password', type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
                  <input type={f.type} required value={(loginForm as Record<string,string>)[f.key]}
                    onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#0a5c36'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: '8px' }}>
                {loading ? '...' : L.loginBtn}
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <a href="/parent/reset-password" style={{ color: '#64748b', fontSize: '0.82rem', textDecoration: 'none' }}>
                  {lang === 'ar' ? '🔑 نسيت كلمة المرور؟' : '🔑 Forgot password?'}
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              {[
                { label: L.name, key: 'name', type: 'text' },
                { label: L.email, key: 'email', type: 'email' },
                { label: L.password, key: 'password', type: 'password' },
                { label: L.phone, key: 'phone', type: 'tel', required: false },
                { label: L.seat, key: 'seatNumber', type: 'text', hint: L.seatHint },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
                  {f.hint && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{f.hint}</div>}
                  <input type={f.type} required={f.required !== false} value={(regForm as Record<string,string>)[f.key]}
                    onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#0a5c36'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: '8px' }}>
                {loading ? '...' : L.registerBtn}
              </button>
            </form>
          )}
        </div>

        {/* Bottom links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '0 4px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', textDecoration: 'none' }}>{L.home} ←</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>🌐 {L.lang}</button>
        </div>
      </div>
    </div>
  )
}
