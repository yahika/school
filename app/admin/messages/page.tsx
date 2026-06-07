'use client'
import { useState, useEffect } from 'react'

interface Msg { id: number; name: string; email: string; phone: string; message: string; isRead: boolean; createdAt: string }

export default function MessagesAdmin() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [selected, setSelected] = useState<Msg | null>(null)
  const [filter, setFilter] = useState<'all'|'unread'|'read'>('all')

  async function load() {
    const d = await fetch('/api/admin/messages').then(r => r.json())
    setMsgs(d.messages ?? [])
  }

  useEffect(() => { load() }, [])

  async function open(msg: Msg) {
    setSelected(msg)
    if (!msg.isRead) {
      await fetch('/api/admin/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: msg.id }) })
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
      setSelected({ ...msg, isRead: true })
    }
  }

  async function del(id: number) {
    if (!confirm('حذف هذه الرسالة؟')) return
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' }).catch(() => {})
    setMsgs(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const unread = msgs.filter(m => !m.isRead).length
  const filtered = filter === 'all' ? msgs : filter === 'unread' ? msgs.filter(m => !m.isRead) : msgs.filter(m => m.isRead)

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '24px', maxWidth: '560px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '24px 28px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '4px' }}>{selected.name}</div>
                  <div style={{ opacity: 0.65, fontSize: '0.82rem' }}>
                    {new Date(selected.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
            </div>

            {/* Contact info */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href={`tel:${selected.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f0fdf4', borderRadius: '999px', textDecoration: 'none', color: '#0a5c36', fontWeight: 700, fontSize: '0.88rem', border: '1px solid #bbf7d0' }}>
                📞 {selected.phone}
              </a>
              {selected.email && (
                <a href={`mailto:${selected.email}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#dbeafe', borderRadius: '999px', textDecoration: 'none', color: '#1d4ed8', fontWeight: 700, fontSize: '0.88rem', border: '1px solid #93c5fd' }}>
                  ✉️ {selected.email}
                </a>
              )}
              <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#dcfce7', borderRadius: '999px', textDecoration: 'none', color: '#15803d', fontWeight: 700, fontSize: '0.88rem', border: '1px solid #86efac' }}>
                💬 واتساب
              </a>
            </div>

            {/* Message body */}
            <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>الرسالة</div>
              <p style={{ color: '#1e293b', fontSize: '1rem', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => del(selected.id)} style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid #fca5a5', color: '#dc2626', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem' }}>🗑 حذف</button>
              <button onClick={() => setSelected(null)} style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem' }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>
          📬 رسائل التواصل
          {unread > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', marginRight: '8px' }}>{unread} جديد</span>}
        </h1>
        <button onClick={load} style={{ marginRight: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', color: '#64748b' }}>🔄</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: `الكل (${msgs.length})`, color: '#0a5c36' },
          { key: 'unread', label: `غير مقروء (${unread})`, color: '#dc2626' },
          { key: 'read', label: `مقروء (${msgs.length - unread})`, color: '#64748b' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} style={{ padding: '7px 16px', borderRadius: '999px', border: '2px solid', borderColor: filter === f.key ? f.color : '#e2e8f0', background: filter === f.key ? f.color : 'white', color: filter === f.key ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(msg => (
          <div key={msg.id} onClick={() => open(msg)} style={{
            background: msg.isRead ? 'white' : '#f0fdf4',
            borderRadius: '14px', padding: '18px 22px',
            border: `1.5px solid ${msg.isRead ? '#e2e8f0' : '#86efac'}`,
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: msg.isRead ? 'none' : '0 2px 12px rgba(10,92,54,0.08)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = msg.isRead ? 'none' : '0 2px 12px rgba(10,92,54,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: msg.isRead ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>👤</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{msg.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>·</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{msg.phone}</span>
                  {msg.email && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{msg.email}</span>}
                  {!msg.isRead && <span style={{ background: '#0a5c36', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>● جديد</span>}
                </div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.88rem', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px' }}>
                  {msg.message}
                </p>
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '6px' }}>
                  {new Date(msg.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>انقر للفتح ←</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            {filter === 'unread' ? 'لا توجد رسائل غير مقروءة' : 'لا توجد رسائل'}
          </div>
        )}
      </div>
    </div>
  )
}
