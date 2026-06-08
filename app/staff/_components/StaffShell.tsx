'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface StaffShellProps {
  title: string
  icon: string
  tabs?: { key: string; label: string }[]
  active?: string
  onTabChange?: (key: string) => void
  children: ReactNode
}

// Shared chrome for every department dashboard: branded header with the
// signed-in staff member's name + a logout button, plus an optional tab bar.
export default function StaffShell({ title, icon, tabs, active, onTabChange, children }: StaffShellProps) {
  const router = useRouter()
  const [me, setMe] = useState<{ name: string; departmentLabel: string } | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/staff/me').then(r => (r.ok ? r.json() : null)).then(setMe).catch(() => {})
  }, [])

  async function logout() {
    setLoggingOut(true)
    try {
      await fetch('/api/staff/logout', { method: 'POST' })
    } finally {
      router.push('/staff/login')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg, #f1f5f9)', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
      <header style={{
        background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', padding: '16px 28px',
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        boxShadow: '0 4px 16px rgba(10,92,54,0.25)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{title}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.76rem' }}>المدرسة الأمريكية · بوابة العاملين</div>
          </div>
        </a>
        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {me && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>{me.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.74rem' }}>{me.departmentLabel}</div>
            </div>
          )}
          <button onClick={logout} disabled={loggingOut} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', borderRadius: '10px', padding: '8px 18px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
          }}>
            {loggingOut ? '...' : 'خروج 🚪'}
          </button>
        </div>
      </header>

      {tabs && tabs.length > 0 && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', display: 'flex', gap: '4px', overflowX: 'auto', position: 'sticky', top: '74px', zIndex: 19 }}>
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => onTabChange?.(tb.key)} style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap',
              color: active === tb.key ? '#0a5c36' : '#64748b',
              borderBottom: active === tb.key ? '3px solid #0a5c36' : '3px solid transparent',
              transition: 'color 0.15s',
            }}>
              {tb.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ padding: '24px 28px 60px', maxWidth: '1280px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
