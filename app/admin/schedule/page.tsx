'use client'
import { useState, useEffect } from 'react'

interface ExamItem { id: number; titleAr: string; titleEn: string; gradeAr: string; gradeEn: string; subjectAr: string; subjectEn: string; examDate: string; startTime: string | null; location: string | null }
type Form = { titleAr: string; titleEn: string; gradeAr: string; gradeEn: string; subjectAr: string; subjectEn: string; examDate: string; startTime: string; location: string }
const emptyForm: Form = { titleAr: '', titleEn: '', gradeAr: '', gradeEn: '', subjectAr: '', subjectEn: '', examDate: '', startTime: '', location: '' }

export default function ScheduleAdmin() {
  const [items, setItems] = useState<ExamItem[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    const d = await fetch('/api/admin/schedule').then(r => r.json())
    setItems(d.schedule ?? [])
  }

  useEffect(() => { load() }, [])

  function startEdit(item: ExamItem) {
    setEditId(item.id)
    setForm({ titleAr: item.titleAr, titleEn: item.titleEn, gradeAr: item.gradeAr, gradeEn: item.gradeEn, subjectAr: item.subjectAr, subjectEn: item.subjectEn, examDate: item.examDate, startTime: item.startTime ?? '', location: item.location ?? '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (editId !== null) {
      await fetch(`/api/admin/schedule/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      showToast('✅ تم تحديث الامتحان'); setEditId(null)
    } else {
      await fetch('/api/admin/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      showToast('✅ تمت الإضافة')
    }
    setForm(emptyForm)
    load()
  }

  async function del(id: number) {
    if (!confirm('حذف؟')) return
    await fetch(`/api/admin/schedule/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📅 جدول الامتحانات</h1>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: editId !== null ? '2px solid #0a5c36' : '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 700, margin: 0, fontSize: '1rem' }}>{editId !== null ? '✏️ تعديل الامتحان' : '➕ إضافة امتحان'}</h2>
          {editId !== null && <button onClick={() => { setEditId(null); setForm(emptyForm) }} style={{ padding: '4px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit', fontSize: '0.82rem' }}>✕ إلغاء</button>}
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          {[
            { label: 'العنوان (عربي) *', key: 'titleAr', required: true },
            { label: 'العنوان (إنجليزي)', key: 'titleEn', required: false },
            { label: 'الصف (عربي) *', key: 'gradeAr', required: true },
            { label: 'الصف (إنجليزي)', key: 'gradeEn', required: false },
            { label: 'المادة (عربي) *', key: 'subjectAr', required: true },
            { label: 'المادة (إنجليزي)', key: 'subjectEn', required: false },
            { label: 'تاريخ الامتحان *', key: 'examDate', type: 'date', required: true },
            { label: 'وقت البداية', key: 'startTime', type: 'time', required: false },
            { label: 'القاعة', key: 'location', required: false },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>{f.label}</label>
              <input type={f.type ?? 'text'} required={f.required} value={(form as Record<string,string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ gridColumn: 'span 3' }}>
            <button type="submit" style={{ background: '#0a5c36', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {editId !== null ? '💾 حفظ التعديلات' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '16px', background: editId === item.id ? '#f0fdf4' : 'white' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.subjectAr} — {item.gradeAr}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(item.examDate).toLocaleDateString('ar-EG')} {item.startTime && `· ${item.startTime}`} {item.location && `· ${item.location}`}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => startEdit(item)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>✏️ تعديل</button>
              <button onClick={() => del(item.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #dc2626', color: '#dc2626', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد جدول</div>}
      </div>
      {toast && <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0a5c36', color: 'white', padding: '12px 24px', borderRadius: '999px', fontWeight: 600, zIndex: 999 }}>{toast}</div>}
    </div>
  )
}
