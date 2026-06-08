'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Lang } from '@/lib/translations'
import { translations as t } from '@/lib/translations'

export default function AdminLoginPage() {
  const [lang, setLang] = useState<Lang>('ar')
  const L = t[lang].admin.login
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored) setLang(stored)
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError(L.error); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        router.push(data.redirectTo || '/admin/dashboard')
        router.refresh()
      } else {
        setError(L.error)
      }
    } catch {
      setError(t[lang].errors.serverError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #061830 0%, #0a2558 50%, #0d3b8c 100%)',
      padding: '24px',
    }}>
      {/* Lang toggle */}
      <button
        onClick={() => {
          const next: Lang = lang === 'ar' ? 'en' : 'ar'
          setLang(next); localStorage.setItem('lang', next)
        }}
        style={{
          position: 'fixed', top: '20px', insetInlineEnd: '20px',
          padding: '6px 14px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        🌐 {t[lang].nav.langToggle}
      </button>

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
            {L.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
            {L.subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="form-label">{L.userLabel}</label>
              <input
                className="form-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                dir="ltr"
                style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
              />
            </div>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label className="form-label">{L.passLabel}</label>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                dir="ltr"
                style={{ textAlign: lang === 'ar' ? 'right' : 'left', paddingInlineEnd: '44px' }}
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
              {loading ? <><span className="spinner" /> {L.buttonLoading}</> : <>🔐 {L.button}</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            ← {t[lang].nav.home}
          </a>
        </p>
      </div>
    </div>
  )
}
