'use client'
import { useState, useEffect } from 'react'

interface Application {
  id: number
  studentNameAr: string
  studentNameEn: string
  dateOfBirth: string
  gradeApplying: string
  parentName: string
  parentPhone: string
  parentEmail: string
  address: string
  notes: string
  status: string
  createdAt: string
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fef9c3', color: '#92400e', label: 'قيد المراجعة' },
  accepted: { bg: '#f0fdf4', color: '#15803d', label: 'مقبول' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'مرفوض' },
}

export default function ApplicationsAdmin() {
  const [apps, setApps] = useState<Application[]>([])
  const [filter, setFilter] = useState('pending')
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [selected, setSelected] = useState<Application | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  async function load() {
    try {
      const d = await fetch('/api/admin/applications').then(r => r.json())
      setApps(d.applications ?? [])
      setChecked([])
    } catch {
      showToast('فشل تحميل الطلبات', false)
    }
  }

  function toggleCheck(id: number) {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleAll() {
    if (checked.length === filtered.length) setChecked([])
    else setChecked(filtered.map(a => a.id))
  }

  async function bulkAction(action: 'accept' | 'reject' | 'delete') {
    if (!checked.length) return
    if (action === 'delete' && !confirm(`حذف ${checked.length} طلب نهائياً؟`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/applications/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checked, action }),
      })
      const d = await res.json()
      if (action === 'accept') {
        setApps(prev => prev.map(a => checked.includes(a.id) ? { ...a, status: 'accepted' } : a))
        showToast(`✅ تم قبول ${d.affected} طلب وإرسال الإيميلات`, true)
      } else if (action === 'reject') {
        setApps(prev => prev.map(a => checked.includes(a.id) ? { ...a, status: 'rejected' } : a))
        showToast(`❌ تم رفض ${d.affected} طلب`, false)
      } else {
        setApps(prev => prev.filter(a => !checked.includes(a.id)))
        showToast(`🗑 تم حذف ${d.affected} طلب`, false)
      }
      setChecked([])
    } catch {
      showToast('حدث خطأ في العملية', false)
    } finally { setBulkLoading(false) }
  }

  // Load on mount + auto-refresh every 15 seconds
  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function updateStatus(id: number, status: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev)
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      showToast(
        status === 'accepted'
          ? '✅ تم قبول الطلب — تم إرسال بريد إلكتروني للولي'
          : '❌ تم رفض الطلب',
        status === 'accepted'
      )
    } catch {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'pending' } : prev)
      showToast('حدث خطأ، يرجى المحاولة مرة أخرى', false)
    } finally {
      setLoadingId(null)
    }
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الطلب نهائياً؟')) return
    setApps(prev => prev.filter(a => a.id !== id))
    setSelected(null)
    try {
      await fetch(`/api/admin/applications/${id}`, { method: 'DELETE' })
    } catch {
      load()
    }
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const counts = {
    all: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#0a5c36' : '#dc2626', color: 'white',
          padding: '12px 28px', borderRadius: '999px', fontWeight: 600,
          fontSize: '0.95rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Profile Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '20px', padding: '32px',
              maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#0a5c36', fontWeight: 800, margin: '0 0 4px', fontSize: '1.4rem' }}>
                  {selected.studentNameAr}
                </h2>
                {selected.studentNameEn && (
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selected.studentNameEn}</div>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
              >✕</button>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem',
                fontWeight: 700,
                background: statusColors[selected.status]?.bg,
                color: statusColors[selected.status]?.color,
              }}>
                {statusColors[selected.status]?.label}
              </span>
            </div>

            {/* Info Grid */}
            {[
              { label: 'الصف المطلوب', value: selected.gradeApplying, icon: '📚' },
              { label: 'تاريخ الميلاد', value: selected.dateOfBirth, icon: '🎂' },
              { label: 'اسم ولي الأمر', value: selected.parentName, icon: '👨‍👩‍👧' },
              { label: 'رقم الهاتف', value: selected.parentPhone, icon: '📞' },
              { label: 'البريد الإلكتروني', value: selected.parentEmail || '—', icon: '📧' },
              { label: 'العنوان', value: selected.address || '—', icon: '📍' },
              { label: 'تاريخ التقديم', value: new Date(selected.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '12px 0', borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
                  <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                </div>
              </div>
            ))}

            {/* Notes */}
            {selected.notes && (
              <div style={{ marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>ملاحظات</div>
                <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>{selected.notes}</div>
              </div>
            )}

            {/* Action Buttons */}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => updateStatus(selected.id, 'accepted')}
                  disabled={loadingId === selected.id}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: '#0a5c36', color: 'white', border: 'none',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem',
                    opacity: loadingId === selected.id ? 0.6 : 1,
                  }}
                >
                  {loadingId === selected.id ? '...' : '✅ قبول الطلب'}
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'rejected')}
                  disabled={loadingId === selected.id}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: '#dc2626', color: 'white', border: 'none',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem',
                    opacity: loadingId === selected.id ? 0.6 : 1,
                  }}
                >
                  {loadingId === selected.id ? '...' : '❌ رفض الطلب'}
                </button>
              </div>
            )}

            <button
              onClick={() => del(selected.id)}
              style={{
                width: '100%', marginTop: '10px', padding: '10px',
                borderRadius: '10px', border: '1px solid #fee2e2',
                color: '#dc2626', background: 'white', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              🗑 حذف الطلب
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📝 طلبات التسجيل</h1>
        <button
          onClick={load}
          style={{ marginRight: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontFamily: 'inherit' }}
        >
          🔄 تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { key: 'pending', label: 'قيد المراجعة', color: '#d97706', hint: 'الطلبات الجديدة' },
          { key: 'all', label: 'الكل', color: '#0a5c36', hint: 'جميع الطلبات' },
          { key: 'accepted', label: 'مقبول', color: '#16a34a', hint: 'الطلبات المقبولة' },
          { key: 'rejected', label: 'مرفوض', color: '#dc2626', hint: 'الطلبات المرفوضة' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            style={{
              background: filter === s.key ? s.color : 'white',
              color: filter === s.key ? 'white' : s.color,
              border: `2px solid ${s.color}`, borderRadius: '12px', padding: '16px',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{counts[s.key as keyof typeof counts]}</div>
            <div style={{ fontSize: '0.8rem' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Bulk action toolbar */}
      {checked.length > 0 && (
        <div style={{ background: '#0a5c36', borderRadius: '12px', padding: '12px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>✓ تم تحديد {checked.length} طلب</span>
          <div style={{ display: 'flex', gap: '8px', marginRight: 'auto', flexWrap: 'wrap' }}>
            <button onClick={() => bulkAction('accept')} disabled={bulkLoading} style={{ padding: '7px 18px', borderRadius: '8px', background: '#f0fdf4', color: '#15803d', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              ✅ قبول الكل
            </button>
            <button onClick={() => bulkAction('reject')} disabled={bulkLoading} style={{ padding: '7px 18px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              ❌ رفض الكل
            </button>
            <button onClick={() => bulkAction('delete')} disabled={bulkLoading} style={{ padding: '7px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              🗑 حذف الكل
            </button>
            <button onClick={() => setChecked([])} style={{ padding: '7px 14px', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Select all row */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', marginBottom: '4px' }}>
          <input type="checkbox" checked={checked.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0a5c36' }} />
          <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
            {checked.length === filtered.length && filtered.length > 0 ? 'إلغاء تحديد الكل' : `تحديد الكل (${filtered.length})`}
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(app => (
          <div
            key={app.id}
            style={{
              background: checked.includes(app.id) ? '#f0fdf4' : 'white',
              borderRadius: '12px', padding: '20px',
              border: checked.includes(app.id) ? '1.5px solid #0a5c36' : '1px solid #e2e8f0',
              cursor: 'pointer',
              opacity: loadingId === app.id ? 0.6 : 1,
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,92,54,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)')}
          >
            {/* Checkbox */}
            <div onClick={e => { e.stopPropagation(); toggleCheck(app.id) }} style={{ paddingTop: '2px', flexShrink: 0 }}>
              <input type="checkbox" checked={checked.includes(app.id)} onChange={() => toggleCheck(app.id)}
                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#0a5c36' }} />
            </div>

            {/* Content */}
            <div onClick={() => setSelected(app)} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                  {app.studentNameAr}
                  {app.studentNameEn && <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginRight: '8px' }}>{app.studentNameEn}</span>}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                  {app.gradeApplying} · {app.parentName} · {app.parentPhone}
                  {app.parentEmail && ` · ${app.parentEmail}`}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>
                  تاريخ الميلاد: {app.dateOfBirth} · تقديم: {new Date(app.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, background: statusColors[app.status]?.bg, color: statusColors[app.status]?.color }}>
                  {loadingId === app.id ? '...' : statusColors[app.status]?.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>انقر للتفاصيل ←</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
              {filter === 'pending' ? '✅' : '📭'}
            </div>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: '#374151' }}>
              {filter === 'pending' ? 'لا توجد طلبات معلقة' : 'لا توجد طلبات'}
            </div>
            {filter === 'pending' && counts.accepted > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                يوجد {counts.accepted} طلب مقبول —{' '}
                <button onClick={() => setFilter('accepted')} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.85rem', textDecoration: 'underline' }}>
                  عرضها
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
