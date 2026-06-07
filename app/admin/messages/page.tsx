'use client'
import { useState, useEffect } from 'react'

interface Msg { id: number; name: string; email: string; phone: string; message: string; isRead: boolean; createdAt: string }

export default function MessagesAdmin() {
  const [msgs, setMsgs] = useState<Msg[]>([])

  async function load() {
    const d = await fetch('/api/admin/messages').then(r => r.json())
    setMsgs(d.messages ?? [])
  }

  useEffect(() => { load() }, [])

  async function markRead(id: number) {
    await fetch('/api/admin/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const unread = msgs.filter(m => !m.isRead).length

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📬 رسائل التواصل {unread > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: '999px', padding: '2px 8px', fontSize: '0.8rem' }}>{unread}</span>}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {msgs.map(msg => (
          <div key={msg.id} style={{ background: msg.isRead ? 'white' : '#f0fdf4', borderRadius: '12px', padding: '20px', border: `1px solid ${msg.isRead ? '#e2e8f0' : '#86efac'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{msg.name}</span>
                  <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{msg.phone}</span>
                  {msg.email && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{msg.email}</span>}
                  {!msg.isRead && <span style={{ background: '#0a5c36', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>جديد</span>}
                </div>
                <p style={{ color: '#374151', margin: '0 0 8px', lineHeight: 1.6 }}>{msg.message}</p>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{new Date(msg.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              {!msg.isRead && (
                <button onClick={() => markRead(msg.id)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', flexShrink: 0, marginRight: '8px' }}>تم القراءة</button>
              )}
            </div>
          </div>
        ))}
        {msgs.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '12px' }}>لا توجد رسائل</div>}
      </div>
    </div>
  )
}
