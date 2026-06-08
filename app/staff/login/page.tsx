'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('من فضلك أدخل اسم المستخدم وكلمة المرور'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        router.push(data.redirectTo || '/staff/login')
        router.refresh()
      } else {
        setError(data.error || 'حدث خطأ، حاول مرة أخرى')
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #061830 0%, #0a2558 50%, #0d3b8c 100%)',
      padding: '24px', fontFamily: 'Tajawal, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8972b 0%, #a07820 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(200,151,43,0.35)',
            fontSize: '1.5rem', fontWeight: 800, color: 'white',
          }}>AS</div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 4px' }}>
            بوابة العاملين بالمدرسة
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
            سجّل دخولك للوصول إلى قسمك
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="form-label">اسم المستخدم</label>
              <input
                className="form-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'right' }}
              />
            </div>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label className="form-label">كلمة المرور</label>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'right', paddingInlineEnd: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', bottom: '10px', insetInlineEnd: '12px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--c-text-muted)', fontSize: '1.1rem',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <div style={{
                marginBottom: '16px', padding: '10px 14px',
                background: 'var(--c-danger-bg)', border: '1px solid #fca5a5',
                borderRadius: 'var(--radius-sm)', color: 'var(--c-danger)',
                fontSize: '0.875rem', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? <><span className="spinner" /> جارٍ الدخول...</> : <>🔐 تسجيل الدخول</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.7 }}>
          هذه البوابة مخصصة للعاملين بالمدرسة فقط
          <br />
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
            ← الرجوع للصفحة الرئيسية
          </a>
        </p>
      </div>
    </div>
  )
}
