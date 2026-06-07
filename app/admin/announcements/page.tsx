'use client'
import { useState, useEffect } from 'react'

interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; isPublished: boolean; createdAt: string }
type Form = { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }

const empty: Form = { titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' }

export default function AnnouncementsAdmin() {
  const [items, setItems] = useState<Announcement[]>([])
  const [form, setForm] = useState<Form>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  async function load() {
    const d = await fetch('/api/admin/announcements').then(r => r.json())
    setItems(d.announcements ?? [])
  }

  useEffect(() => { load() }, [])

  function startEdit(item: Announcement) {
    setEditId(item.id)
    setForm({ titleAr: item.titleAr, titleEn: item.titleEn, bodyAr: item.bodyAr, bodyEn: item.bodyEn })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() { setEditId(null); setForm(empty) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      if (editId !== null) {
        await fetch(`/api/admin/announcements/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        showToast('✅ تم تحديث الإعلان')
        setEditId(null)
      } else {
        await fetch('/api/admin/announcements', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, isPublished: true }),
        })
        showToast('✅ تم نشر الإعلان')
      }
      setForm(empty)
      load()
    } finally { setSaving(false) }
  }

  async function toggle(id: number, current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    showToast(current ? '🙈 تم إخفاء الإعلان' : '📢 تم نشر الإعلان')
    load()
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الإعلان نهائياً؟')) return
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    showToast('تم الحذف', false)
    if (editId === id) cancelEdit()
    load()
  }

  const isEditing = editId !== null

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#0a5c36' : '#dc2626', color: 'white',
          padding: '12px 28px', borderRadius: '999px', fontWeight: 600,
          zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📢 الإعلانات</h1>
      </div>

      {/* Form */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '28px',
        border: isEditing ? '2px solid #0a5c36' : '1px solid #e2e8f0',
        boxShadow: isEditing ? '0 0 0 4px rgba(10,92,54,0.08)' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 700, margin: 0, fontSize: '1rem' }}>
            {isEditing ? '✏️ تعديل الإعلان' : '➕ إعلان جديد'}
          </h2>
          {isEditing && (
            <button onClick={cancelEdit} style={{ padding: '5px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit', fontSize: '0.82rem' }}>
              ✕ إلغاء التعديل
            </button>
          )}
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {([{ label: 'العنوان بالعربية *', key: 'titleAr', dir: 'rtl' }, { label: 'العنوان بالإنجليزية *', key: 'titleEn', dir: 'ltr' }] as {label:string;key:keyof Form;dir:string}[]).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
                <input required dir={f.dir} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box', fontSize: '0.9rem' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {([{ label: 'النص بالعربية *', key: 'bodyAr', dir: 'rtl' }, { label: 'النص بالإنجليزية *', key: 'bodyEn', dir: 'ltr' }] as {label:string;key:keyof Form;dir:string}[]).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
                <textarea required rows={4} dir={f.dir} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.9rem' }} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} style={{
            background: isEditing ? 'linear-gradient(135deg,#0a5c36,#0d7a45)' : 'linear-gradient(135deg,#0a5c36,#0d7a45)',
            color: 'white', padding: '11px 32px', borderRadius: '10px', border: 'none',
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            fontSize: '0.95rem', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '...' : isEditing ? '💾 حفظ التعديلات' : '📤 نشر الإعلان'}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: 'white', borderRadius: '14px', padding: '20px 24px',
            border: editId === item.id ? '2px solid #0a5c36' : '1px solid #e2e8f0',
            transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.titleAr}</span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '999px', background: item.isPublished ? '#f0fdf4' : '#fef9c3', color: item.isPublished ? '#15803d' : '#92400e', fontWeight: 700 }}>
                    {item.isPublished ? '● منشور' : '○ مخفي'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7, marginBottom: '6px' }}>{item.bodyAr}</div>
                {item.titleEn && <div style={{ fontSize: '0.8rem', color: '#94a3b8', direction: 'ltr', textAlign: 'right' }}>{item.titleEn}</div>}
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px' }}>{new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => startEdit(item)} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600 }}>
                  ✏️ تعديل
                </button>
                <button onClick={() => toggle(item.id, item.isPublished)} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #64748b', color: '#64748b', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                  {item.isPublished ? '🙈 إخفاء' : '📢 نشر'}
                </button>
                <button onClick={() => del(item.id)} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #dc2626', color: '#dc2626', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                  🗑 حذف
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            لا توجد إعلانات — أضف أول إعلان من الأعلى
          </div>
        )}
      </div>
    </div>
  )
}
