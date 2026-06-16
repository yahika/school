'use client'
import { useState } from 'react'

// ── Flip this to false before going live ──────────────────────────────────────
const DEV_MODE = true
// ─────────────────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    label: 'Public', icon: '🌐', color: '#22c55e',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Results', href: '/results' },
      { label: 'Apply', href: '/apply' },
      { label: 'Apply Status', href: '/apply/status' },
      { label: 'News', href: '/news' },
      { label: 'Schedule', href: '/schedule' },
      { label: 'Calendar', href: '/calendar' },
    ],
  },
  {
    label: 'Parent', icon: '👨‍👩‍👧', color: '#38bdf8',
    links: [
      { label: 'Login', href: '/parent/login' },
      { label: 'Dashboard', href: '/parent/dashboard' },
      { label: 'Reset PW', href: '/parent/reset-password' },
    ],
  },
  {
    label: 'Admin', icon: '🛠️', color: '#f59e0b',
    links: [
      { label: 'Login', href: '/admin/login' },
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Students', href: '/admin/students' },
      { label: 'Parents', href: '/admin/parents' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Announcements', href: '/admin/announcements' },
      { label: 'Fees', href: '/admin/fees' },
      { label: 'Schedule', href: '/admin/schedule' },
      { label: 'Calendar', href: '/admin/calendar' },
      { label: 'Messages', href: '/admin/messages' },
      { label: 'WhatsApp', href: '/admin/whatsapp' },
      { label: 'Staff Accounts', href: '/admin/staff' },
    ],
  },
  {
    label: 'Staff', icon: '👔', color: '#c084fc',
    links: [
      { label: 'Login', href: '/staff/login' },
      { label: 'شؤون الطلبة', href: '/staff/student-affairs' },
      { label: 'الباصات', href: '/staff/buses' },
      { label: 'الحسابات', href: '/staff/accounts' },
      { label: 'كونترول', href: '/staff/results-control' },
      { label: 'المخازن', href: '/staff/inventory' },
      { label: 'المدير', href: '/staff/principal' },
      { label: 'المالك', href: '/staff/owner' },
    ],
  },
]

export default function DevBar() {
  const [open, setOpen] = useState(false)

  if (!DEV_MODE) return null

  return (
    <>
      {/* fixed toggle button — bottom-left */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
          background: open ? '#1e293b' : '#f59e0b',
          color: open ? '#94a3b8' : '#000',
          border: 'none', borderRadius: '12px',
          padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>{open ? '✕' : '🗂️'}</span>
        {open ? 'CLOSE' : 'DEV NAV'}
      </button>

      {/* panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '60px', left: '20px', zIndex: 9998,
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '16px', padding: '20px',
          width: 'min(96vw, 760px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          maxHeight: '70vh', overflowY: 'auto',
          fontFamily: 'monospace',
        }}>
          <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: '16px' }}>
            ⚡ DEV NAVIGATION — all pages
          </div>

          {GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              <div style={{ color: group.color, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '8px' }}>
                {group.icon} {group.label.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {group.links.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{
                      background: group.color + '18',
                      border: `1px solid ${group.color}35`,
                      color: group.color,
                      borderRadius: '7px', padding: '4px 11px',
                      textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                      transition: 'background 0.15s',
                      display: 'inline-block',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = group.color + '35')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = group.color + '18')}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #1e293b', marginTop: '8px', paddingTop: '10px', fontSize: '0.64rem', color: '#334155' }}>
            Set DEV_MODE = false in app/_components/DevBar.tsx to hide before going live
          </div>
        </div>
      )}
    </>
  )
}
