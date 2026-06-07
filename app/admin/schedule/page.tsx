'use client'
import { useState, useEffect } from 'react'

interface ExamItem { id: number; titleAr: string; gradeAr: string; subjectAr: string; examDate: string; startTime: string | null; location: string | null }

export default function ScheduleAdmin() {
  const [items, setItems] = useState<ExamItem[]>([])
  const [form, setForm] = useState({ titleAr: '', titleEn: '', gradeAr: '', gradeEn: '', subjectAr: '', subjectEn: '', examDate: '', startTime: '', location: '' })

  async function load() {
    const d = await fetch('/api/admin/schedule').then(r => r.json())
    setItems(d.schedule ?? [])
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ titleAr: '', titleEn: '', gradeAr: '', gradeEn: '', subjectAr: '', subjectEn: '', examDate: '', startTime: '', location: '' })
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

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>➕ إضافة امتحان</h2>
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
            <button type="submit" style={{ background: '#0a5c36', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إضافة</button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.subjectAr} — {item.gradeAr}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(item.examDate).toLocaleDateString('ar-EG')} {item.startTime && `· ${item.startTime}`} {item.location && `· ${item.location}`}</div>
            </div>
            <button onClick={() => del(item.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #dc2626', color: '#dc2626', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
          </div>
        ))}
        {items.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد جدول</div>}
      </div>
    </div>
  )
}
