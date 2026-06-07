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
  const [pendingMsg, setPendingMsg] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', phone: '',
    seatNumber: '', studentNameAr: '', dateOfBirth: '',
  })

  const L = lang === 'ar' ? {
    title: 'بوابة أولياء الأمور',
    subtitle: 'تابع مسيرة طفلك الأكاديمية',
    login: 'تسجيل الدخول', register: 'حساب جديد',
    loginBtn: 'دخول', registerBtn: 'إنشاء حساب',
    home: 'الرئيسية', lang: 'English',
    forgot: 'نسيت كلمة المرور؟',
    verifyTitle: 'التحقق من هوية ولي الأمر',
    verifyNote: 'لضمان أمان بيانات طفلك، نحتاج التحقق من 4 معلومات',
    fields: {
      parentName: 'اسم ولي الأمر الكامل *',
      parentPhone: 'رقم هاتف ولي الأمر *',
      parentPhoneHint: 'نفس الرقم المستخدم في طلب التسجيل',
      email: 'البريد الإلكتروني *',
      emailHint: 'سيُستخدم لتسجيل الدخول',
      password: 'كلمة المرور *',
      passwordHint: '6 أحرف على الأقل',
      seatNumber: 'رقم جلوس الطالب *',
      seatHint: 'الرقم الموجود في كشف النتيجة',
      studentName: 'الاسم الكامل للطالب بالعربية *',
      studentNameHint: 'أدخل الاسم كما هو في السجلات الرسمية',
      dob: 'تاريخ ميلاد الطالب *',
      dobHint: 'يجب أن يطابق السجلات المدرسية',
    },
    pendingTitle: '⏳ في انتظار موافقة الإدارة',
    pendingBody: 'تم إنشاء حسابك بنجاح وسيتم مراجعته من قِبل إدارة المدرسة. سيتم إعلامك عند تفعيل الحساب.',
    pendingApproval: '⚠️ حسابك قيد المراجعة من الإدارة — يرجى الانتظار حتى يتم التفعيل',
    loginEmail: 'البريد الإلكتروني',
    loginPassword: 'كلمة المرور',
  } : {
    title: 'Parent Portal',
    subtitle: "Track your child's academic journey",
    login: 'Login', register: 'New Account',
    loginBtn: 'Sign In', registerBtn: 'Create Account',
    home: 'Home', lang: 'عربي',
    forgot: 'Forgot password?',
    verifyTitle: 'Parent Identity Verification',
    verifyNote: 'To protect your child\'s data, we verify 4 pieces of information',
    fields: {
      parentName: 'Parent Full Name *',
      parentPhone: 'Parent Phone Number *',
      parentPhoneHint: 'Same number used in the enrollment application',
      email: 'Email Address *',
      emailHint: 'Will be used to log in',
      password: 'Password *',
      passwordHint: 'At least 6 characters',
      seatNumber: 'Student Seat Number *',
      seatHint: 'The number found on the result sheet',
      studentName: 'Student Full Name in Arabic *',
      studentNameHint: 'Enter exactly as it appears in official records',
      dob: "Student's Date of Birth *",
      dobHint: 'Must match school records',
    },
    pendingTitle: '⏳ Awaiting Admin Approval',
    pendingBody: 'Your account was created and is pending review by school administration. You will be notified once it is activated.',
    pendingApproval: '⚠️ Your account is under review — please wait for activation',
    loginEmail: 'Email Address',
    loginPassword: 'Password',
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setPendingMsg(''); setLoading(true)
    try {
      const res = await fetch('/api/parent/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const d = await res.json()
      if (res.status === 403 && d.error === 'PENDING_APPROVAL') {
        setPendingMsg(L.pendingApproval)
        return
      }
      if (!res.ok) throw new Error(d.error)
      router.push('/parent/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login error'))
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
      // Show pending approval screen
      setTab('pending' as typeof tab)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === 'ar' ? 'خطأ في إنشاء الحساب' : 'Registration error'))
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem',
    boxSizing: 'border-box' as const, outline: 'none', transition: 'border 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#041f12 0%,#063d22 50%,#0a5c36 100%)', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/">
            <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'white', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(200,151,43,0.4)' }}>AEA</div>
          </a>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 6px' }}>{L.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem' }}>{L.subtitle}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '28px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

          {/* Pending approval screen */}
          {(tab as string) === 'pending' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '12px', fontSize: '1.2rem' }}>{L.pendingTitle}</h2>
              <p style={{ color: '#64748b', lineHeight: 1.8, marginBottom: '24px', fontSize: '0.9rem' }}>{L.pendingBody}</p>
              <button onClick={() => setTab('login')} style={{ padding: '11px 28px', background: '#0a5c36', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                {lang === 'ar' ? '← العودة لتسجيل الدخول' : '← Back to Login'}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
                {(['login', 'register'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(''); setPendingMsg('') }} style={{
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

              {pendingMsg && (
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#92400e', fontSize: '0.85rem', fontWeight: 600 }}>
                  {pendingMsg}
                </div>
              )}
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {error}
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{L.loginEmail}</label>
                    <input type="email" required value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{L.loginPassword}</label>
                    <input type="password" required value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                    {loading ? '...' : L.loginBtn}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <a href="/parent/reset-password" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>{L.forgot}</a>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  {/* Verification notice */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                    <div style={{ fontWeight: 700, color: '#0a5c36', fontSize: '0.85rem', marginBottom: '4px' }}>🔐 {L.verifyTitle}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.6 }}>{L.verifyNote}</div>
                  </div>

                  {/* Parent info section */}
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.82rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      👨‍👩‍👧 {lang === 'ar' ? 'بيانات ولي الأمر' : 'Parent Information'}
                    </div>
                    {[
                      { label: L.fields.parentName, key: 'name', type: 'text', hint: '' },
                      { label: L.fields.parentPhone, key: 'phone', type: 'tel', hint: L.fields.parentPhoneHint },
                      { label: L.fields.email, key: 'email', type: 'email', hint: L.fields.emailHint },
                      { label: L.fields.password, key: 'password', type: 'password', hint: L.fields.passwordHint },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.83rem', color: '#374151' }}>{f.label}</label>
                        {f.hint && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>{f.hint}</div>}
                        <input type={f.type} required value={(regForm as Record<string,string>)[f.key]} onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inputStyle, background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>
                    ))}
                  </div>

                  {/* Student verification section */}
                  <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #fde68a' }}>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.82rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      👨‍🎓 {lang === 'ar' ? 'التحقق من بيانات الطالب' : 'Student Verification'}
                    </div>
                    {[
                      { label: L.fields.seatNumber, key: 'seatNumber', type: 'text', hint: L.fields.seatHint },
                      { label: L.fields.studentName, key: 'studentNameAr', type: 'text', hint: L.fields.studentNameHint, dir: 'rtl' },
                      { label: L.fields.dob, key: 'dateOfBirth', type: 'date', hint: L.fields.dobHint },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.83rem', color: '#92400e' }}>{f.label}</label>
                        {f.hint && <div style={{ fontSize: '0.72rem', color: '#b45309', marginBottom: '4px' }}>{f.hint}</div>}
                        <input type={f.type} required dir={f.dir} value={(regForm as Record<string,string>)[f.key]} onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inputStyle, background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#d97706'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                    {loading ? '...' : `🔐 ${L.registerBtn}`}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 4px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none' }}>← {L.home}</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>🌐 {L.lang}</button>
        </div>
      </div>
    </div>
  )
}
