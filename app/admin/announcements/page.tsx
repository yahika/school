'use client'
import { useState, useEffect } from 'react'

interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; isPublished: boolean; createdAt: string }

export default function AnnouncementsAdmin() {
  const [items, setItems] = useState<Announcement[]>([])
  const [form, setForm] = useState({ titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    const d = await fetch('/api/admin/announcements').then(r => r.json())
    setItems(d.announcements ?? [])
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/admin/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isPublished: true }),
    })
    setForm({ titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' })
    showToast('✅ تم نشر الإعلان'); load(); setSaving(false)
  }

  async function toggle(id: number, current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !current }) })
    load()
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الإعلان؟')) return
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    showToast('تم الحذف'); load()
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📢 الإعلانات</h1>
      </div>

      {/* Add form */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>➕ إعلان جديد</h2>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {[{ label: 'العنوان بالعربية *', key: 'titleAr' }, { label: 'العنوان بالإنجليزية *', key: 'titleEn' }].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem' }}>{f.label}</label>
                <input required value={(form as Record<string,string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {[{ label: 'النص بالعربية *', key: 'bodyAr' }, { label: 'النص بالإنجليزية *', key: 'bodyEn' }].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem' }}>{f.label}</label>
                <textarea required rows={3} value={(form as Record<string,string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} style={{ background: '#0a5c36', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? '...' : '📤 نشر الإعلان'}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{item.titleAr}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>{item.bodyAr}</div>
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', background: item.isPublished ? '#f0fdf4' : '#fef9c3', color: item.isPublished ? '#15803d' : '#92400e', fontWeight: 600 }}>
                {item.isPublished ? '● منشور' : '○ مخفي'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => toggle(item.id, item.isPublished)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                {item.isPublished ? 'إخفاء' : 'نشر'}
              </button>
              <button onClick={() => del(item.id)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #dc2626', color: '#dc2626', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>حذف</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>لا توجد إعلانات</div>}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0a5c36', color: 'white', padding: '12px 24px', borderRadius: '999px', fontWeight: 600 }}>{toast}</div>}
    </div>
  )
}
