'use client'
import { useState, useEffect } from 'react'

interface CalEvent { id: number; titleAr: string; titleEn: string; date: string; endDate: string | null; type: string; color: string | null; descriptionAr: string | null; descriptionEn: string | null; isPublic: boolean }

const TYPE_CONFIG: Record<string, { icon: string; color: string; labelAr: string }> = {
  exam:    { icon: '📝', color: '#dc2626', labelAr: 'امتحان' },
  holiday: { icon: '🌴', color: '#16a34a', labelAr: 'إجازة' },
  event:   { icon: '🎉', color: '#2563eb', labelAr: 'فعالية' },
  term:    { icon: '📚', color: '#7c3aed', labelAr: 'فصل دراسي' },
  meeting: { icon: '👨‍👩‍👧', color: '#c8972b', labelAr: 'اجتماع أولياء' },
}

const empty = { titleAr: '', titleEn: '', date: '', endDate: '', type: 'event', color: '', descriptionAr: '', descriptionEn: '', isPublic: true }

export default function CalendarAdmin() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    const d = await fetch('/api/admin/calendar').then(r => r.json())
    setEvents(d.events ?? [])
  }
  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, endDate: form.endDate || null, color: TYPE_CONFIG[form.type]?.color || form.color || null }
    if (editId !== null) {
      await fetch(`/api/admin/calendar/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      showToast('✅ تم تحديث الحدث'); setEditId(null)
    } else {
      await fetch('/api/admin/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      showToast('✅ تمت الإضافة')
    }
    setForm(empty); load(); setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الحدث؟')) return
    await fetch(`/api/admin/calendar/${id}`, { method: 'DELETE' })
    showToast('تم الحذف'); load()
  }

  function startEdit(ev: CalEvent) {
    setEditId(ev.id)
    setForm({ titleAr: ev.titleAr, titleEn: ev.titleEn, date: ev.date, endDate: ev.endDate ?? '', type: ev.type, color: ev.color ?? '', descriptionAr: ev.descriptionAr ?? '', descriptionEn: ev.descriptionEn ?? '', isPublic: ev.isPublic })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const grouped = events.reduce((acc, e) => {
    const month = e.date.slice(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(e)
    return acc
  }, {} as Record<string, CalEvent[]>)

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      {toast && <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0a5c36', color: 'white', padding: '12px 28px', borderRadius: '999px', fontWeight: 600, zIndex: 9999 }}>{toast}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📅 التقويم المدرسي</h1>
        <a href="/calendar" target="_blank" style={{ marginRight: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0a5c36', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>🔗 عرض التقويم</a>
      </div>

      {/* Form */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: editId !== null ? '2px solid #0a5c36' : '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 700, margin: 0, fontSize: '1rem' }}>{editId !== null ? '✏️ تعديل الحدث' : '➕ إضافة حدث'}</h2>
          {editId !== null && <button onClick={() => { setEditId(null); setForm(empty) }} style={{ padding: '5px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', color: '#64748b' }}>✕ إلغاء</button>}
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>العنوان (عربي) *</label>
              <input required value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>العنوان (إنجليزي) *</label>
              <input required dir="ltr" value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>النوع *</label>
              <select required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', appearance: 'auto' as const, boxSizing: 'border-box' as const }}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.labelAr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>تاريخ البداية *</label>
              <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>تاريخ الانتهاء (اختياري)</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#0a5c36' }} />
                عام (يظهر للجميع)
              </label>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>وصف (عربي)</label>
              <textarea rows={2} value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>وصف (إنجليزي)</label>
              <textarea rows={2} dir="ltr" value={form.descriptionEn} onChange={e => setForm(p => ({ ...p, descriptionEn: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ background: '#0a5c36', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? '...' : editId !== null ? '💾 حفظ التعديلات' : '➕ إضافة'}
          </button>
        </form>
      </div>

      {/* Events list grouped by month */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([month, evs]) => (
        <div key={month} style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 800, color: '#0a5c36', fontSize: '1rem', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #f0fdf4' }}>
            📅 {new Date(month + '-01').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {evs.map(ev => {
              const cfg = TYPE_CONFIG[ev.type]
              return (
                <div key={ev.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: `1px solid #e2e8f0`, display: 'flex', alignItems: 'center', gap: '12px', borderRight: `4px solid ${cfg?.color ?? '#0a5c36'}` }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{cfg?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{ev.titleAr}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                      {new Date(ev.date).toLocaleDateString('ar-EG')}
                      {ev.endDate && ` — ${new Date(ev.endDate).toLocaleDateString('ar-EG')}`}
                      {' · '}{cfg?.labelAr}
                      {!ev.isPublic && <span style={{ marginRight: '6px', color: '#d97706', fontWeight: 600 }}> · 🔒 خاص</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEdit(ev)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600 }}>✏️</button>
                    <button onClick={() => del(ev.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #dc2626', color: '#dc2626', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📅</div>
          لا توجد أحداث — أضف أول حدث من الأعلى
        </div>
      )}
    </div>
  )
}
