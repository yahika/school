'use client'
import { useState, useEffect } from 'react'

interface FeeRecord { id: number; studentName: string; seatNumber: string; gradeAr: string; amount: number; isPaid: boolean; paidAt: string | null; academicYear: string; notes: string }

export default function FeesAdmin() {
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [form, setForm] = useState({ studentName: '', seatNumber: '', gradeAr: '', amount: '', academicYear: '2025-2026', notes: '' })
  const [filter, setFilter] = useState('all')

  async function load() {
    const d = await fetch('/api/admin/fees').then(r => r.json())
    setFees(d.fees ?? [])
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ studentName: '', seatNumber: '', gradeAr: '', amount: '', academicYear: '2025-2026', notes: '' })
    load()
  }

  async function togglePaid(id: number, isPaid: boolean) {
    await fetch(`/api/admin/fees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPaid: !isPaid }) })
    load()
  }

  async function del(id: number) {
    if (!confirm('حذف؟')) return
    await fetch(`/api/admin/fees/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = filter === 'all' ? fees : filter === 'paid' ? fees.filter(f => f.isPaid) : fees.filter(f => !f.isPaid)
  const totalCollected = fees.filter(f => f.isPaid).reduce((s, f) => s + f.amount, 0)
  const totalPending = fees.filter(f => !f.isPaid).reduce((s, f) => s + f.amount, 0)

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>💰 متابعة المصاريف</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'إجمالي الطلاب', value: fees.length, color: '#0a5c36' },
          { label: 'تم التحصيل', value: `${totalCollected.toLocaleString()} ج.م`, color: '#16a34a' },
          { label: 'متأخر', value: `${totalPending.toLocaleString()} ج.م`, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>➕ إضافة طالب</h2>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', alignItems: 'end' }}>
          {[
            { label: 'اسم الطالب *', key: 'studentName', required: true },
            { label: 'رقم الجلوس', key: 'seatNumber', required: false },
            { label: 'الصف *', key: 'gradeAr', required: true },
            { label: 'المبلغ (ج.م) *', key: 'amount', type: 'number', required: true },
            { label: 'العام الدراسي *', key: 'academicYear', required: true },
            { label: 'ملاحظات', key: 'notes', required: false },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.82rem' }}>{f.label}</label>
              <input type={f.type ?? 'text'} required={f.required} value={(form as Record<string,string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button type="submit" style={{ background: '#0a5c36', color: 'white', padding: '9px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إضافة</button>
        </form>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ key: 'all', label: 'الكل' }, { key: 'unpaid', label: 'لم يدفع' }, { key: 'paid', label: 'دفع' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '6px 18px', borderRadius: '999px', border: '1px solid #0a5c36', background: filter === f.key ? '#0a5c36' : 'white', color: filter === f.key ? 'white' : '#0a5c36', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {filtered.map((fee, i) => (
          <div key={fee.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{fee.studentName} {fee.seatNumber && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({fee.seatNumber})</span>}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{fee.gradeAr} · {fee.academicYear} · {fee.amount.toLocaleString()} ج.م</div>
            </div>
            <span style={{ padding: '3px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, background: fee.isPaid ? '#f0fdf4' : '#fef2f2', color: fee.isPaid ? '#15803d' : '#dc2626' }}>
              {fee.isPaid ? `✅ دفع ${fee.paidAt ? new Date(fee.paidAt).toLocaleDateString('ar-EG') : ''}` : '❌ لم يدفع'}
            </span>
            <button onClick={() => togglePaid(fee.id, fee.isPaid)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
              {fee.isPaid ? 'إلغاء' : 'تسجيل دفع'}
            </button>
            <button onClick={() => del(fee.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#94a3b8', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>🗑</button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا توجد سجلات</div>}
      </div>
    </div>
  )
}
