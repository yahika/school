'use client'
import { useState, useEffect } from 'react'

interface Parent { id: number; name: string; email: string; phone: string; studentName: string; seatNumber: string; gradeAr: string; isActive: boolean; createdAt: string }

export default function ParentsAdmin() {
  const [parents, setParents] = useState<Parent[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'pending'|'active'>('pending')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  async function load() {
    const d = await fetch('/api/admin/parents').then(r => r.json())
    setParents(d.parents ?? [])
  }
  useEffect(() => { load() }, [])

  async function toggleActive(id: number, current: boolean) {
    setParents(p => p.map(x => x.id === id ? { ...x, isActive: !current } : x))
    await fetch(`/api/admin/parents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) })
    showToast(current ? '🔒 تم تعطيل الحساب' : '✅ تم تفعيل الحساب')
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الحساب نهائياً؟')) return
    setParents(p => p.filter(x => x.id !== id))
    await fetch(`/api/admin/parents/${id}`, { method: 'DELETE' })
    showToast('تم الحذف', false)
  }

  const pending = parents.filter(p => !p.isActive)
  const byFilter = filter === 'all' ? parents : filter === 'pending' ? parents.filter(p => !p.isActive) : parents.filter(p => p.isActive)
  const filtered = byFilter.filter(p =>
    p.name.includes(search) || p.email.includes(search) ||
    p.studentName.includes(search) || p.seatNumber.includes(search)
  )

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      {toast && <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0a5c36' : '#dc2626', color: 'white', padding: '12px 28px', borderRadius: '999px', fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>👨‍👩‍👧 أولياء الأمور</h1>
        <span style={{ background: '#f0fdf4', color: '#0a5c36', fontWeight: 700, fontSize: '0.85rem', padding: '4px 14px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
          {parents.length} حساب
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو البريد أو رقم الجلوس"
          style={{ marginRight: 'auto', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem', minWidth: '260px' }} />
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', color: '#64748b' }}>🔄</button>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem' }}>{pending.length} حساب في انتظار الموافقة</div>
            <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: '2px' }}>راجع الطلبات أدناه وفعّل أو ارفض كل حساب</div>
          </div>
          <button onClick={() => setFilter('pending')} style={{ padding: '8px 18px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
            عرض الطلبات
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'pending', label: `انتظار الموافقة (${pending.length})`, color: '#d97706' },
          { key: 'active', label: `نشط (${parents.filter(p=>p.isActive).length})`, color: '#0a5c36' },
          { key: 'all', label: `الكل (${parents.length})`, color: '#64748b' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} style={{ padding: '7px 16px', borderRadius: '999px', border: '2px solid', borderColor: filter === f.key ? f.color : '#e2e8f0', background: filter === f.key ? f.color : 'white', color: filter === f.key ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'إجمالي الحسابات', value: parents.length, color: '#0a5c36', icon: '👨‍👩‍👧' },
          { label: 'حسابات نشطة', value: parents.filter(p => p.isActive).length, color: '#16a34a', icon: '✅' },
          { label: 'حسابات معطلة', value: parents.filter(p => !p.isActive).length, color: '#dc2626', icon: '🔒' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: '14px', padding: '18px 22px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', opacity: p.isActive ? 1 : 0.6 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: p.isActive ? 'linear-gradient(135deg,#0a5c36,#0d7a45)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>👤</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{p.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>{p.email} {p.phone && `· ${p.phone}`}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>
                طالب: <strong style={{ color: '#0a5c36' }}>{p.studentName}</strong> · رقم جلوس: <strong>{p.seatNumber}</strong> · {p.gradeAr}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, background: p.isActive ? '#f0fdf4' : '#fef2f2', color: p.isActive ? '#15803d' : '#dc2626' }}>
                {p.isActive ? '● نشط' : '○ معطل'}
              </span>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {new Date(p.createdAt).toLocaleDateString('ar-EG')}
              </div>
              <button onClick={() => toggleActive(p.id, p.isActive)} style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${p.isActive ? '#dc2626' : '#0a5c36'}`, color: p.isActive ? '#dc2626' : '#0a5c36', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600 }}>
                {p.isActive ? '🔒 تعطيل' : '✅ تفعيل'}
              </button>
              <button onClick={() => del(p.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#94a3b8', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>🗑</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👨‍👩‍👧</div>
            {search ? 'لا توجد نتائج مطابقة' : 'لم يسجل أي ولي أمر بعد — سيظهرون هنا عند تسجيلهم في البوابة'}
          </div>
        )}
      </div>
    </div>
  )
}
