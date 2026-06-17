'use client'
import { useState } from 'react'

// ── Flip to false before going live ──────────────────────────────────────────
const DEV_MODE = true
// ─────────────────────────────────────────────────────────────────────────────

// bypass() builds a URL that auto-logs you in and redirects to the page.
// No password needed. Only works outside production.
function bypass(as: string, extra?: string) {
  const params = new URLSearchParams({ as })
  if (extra) params.set('dept', extra)
  return `/api/dev/bypass?${params}`
}

const GROUPS = [
  {
    label: 'Public', icon: '🌐', color: '#22c55e',
    links: [
      { label: 'Home',           href: '/' },
      { label: 'Results',        href: '/results' },
      { label: 'Apply',          href: '/apply' },
      { label: 'Apply Status',   href: '/apply/status' },
      { label: 'News',           href: '/news' },
      { label: 'Exam Schedule',  href: '/schedule' },
      { label: 'Calendar',       href: '/calendar' },
    ],
  },
  {
    label: 'Parent Portal', icon: '👨‍👩‍👧', color: '#38bdf8',
    links: [
      { label: 'Dashboard',      href: bypass('parent') },
      { label: 'Login page',     href: '/parent/login' },
      { label: 'Reset PW',       href: '/parent/reset-password' },
    ],
  },
  {
    label: 'Admin Portal', icon: '🛠️', color: '#f59e0b',
    links: [
      { label: 'Dashboard',      href: bypass('admin') },
      { label: 'Students',       href: '/admin/students' },
      { label: 'Parents',        href: '/admin/parents' },
      { label: 'Applications',   href: '/admin/applications' },
      { label: 'Announcements',  href: '/admin/announcements' },
      { label: 'Fees',           href: '/admin/fees' },
      { label: 'Schedule',       href: '/admin/schedule' },
      { label: 'Calendar',       href: '/admin/calendar' },
      { label: 'Messages',       href: '/admin/messages' },
      { label: 'WhatsApp',       href: '/admin/whatsapp' },
      { label: 'Staff Accounts', href: '/admin/staff' },
      { label: 'Login page',     href: '/admin/login' },
    ],
  },
  {
    label: 'Staff Portals', icon: '👔', color: '#c084fc',
    links: [
      { label: 'شؤون الطلبة',   href: bypass('staff', 'student_affairs') },
      { label: 'الباصات',        href: bypass('staff', 'buses') },
      { label: 'الحسابات',       href: bypass('staff', 'accounts') },
      { label: 'كونترول',        href: bypass('staff', 'results_control') },
      { label: 'المخازن',        href: bypass('staff', 'inventory') },
      { label: 'المدير',         href: bypass('staff', 'principal') },
      { label: 'المالك',         href: bypass('staff', 'owner') },
      { label: 'Login page',     href: '/staff/login' },
    ],
  },
]

export default function DevBar() {
  const [open, setOpen] = useState(false)

  if (!DEV_MODE) return null

  return (
    <>
      {/* fixed toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
          background: open ? '#1e293b' : '#f59e0b',
          color: open ? '#94a3b8' : '#000',
          border: 'none', borderRadius: '12px',
          padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>{open ? '✕' : '🗂️'}</span>
        {open ? 'CLOSE' : 'DEV NAV'}
      </button>

      {/* clear-session shortcut — only when panel is open */}
      {open && (
        <a
          href="/api/dev/bypass?as=clear"
          style={{
            position: 'fixed', bottom: '20px', left: '135px', zIndex: 9999,
            background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '12px',
            padding: '8px 14px', cursor: 'pointer',
            fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px',
          }}
        >
          🚪 Clear Session
        </a>
      )}

      {/* panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '64px', left: '20px', zIndex: 9998,
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '16px', padding: '20px',
          width: 'min(96vw, 780px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          maxHeight: '72vh', overflowY: 'auto',
          fontFamily: 'monospace',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em' }}>
              ⚡ DEV NAV — click any page to enter without a password
            </div>
          </div>

          {GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              <div style={{ color: group.color, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '8px' }}>
                {group.icon} {group.label.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {group.links.map(link => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    style={{
                      background: group.color + '18',
                      border: `1px solid ${group.color}35`,
                      color: group.color,
                      borderRadius: '7px', padding: '5px 12px',
                      textDecoration: 'none', fontSize: '0.76rem', fontWeight: 600,
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

          <div style={{ borderTop: '1px solid #1e293b', marginTop: '4px', paddingTop: '10px', fontSize: '0.63rem', color: '#334155' }}>
            DEV_MODE = true · set to false in app/_components/DevBar.tsx before going live · /api/dev/bypass is blocked in production
          </div>
        </div>
      )}
    </>
  )
}
