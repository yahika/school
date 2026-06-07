'use client'
import { useState, useEffect } from 'react'

interface Application {
  id: number; studentNameAr: string; studentNameEn: string; dateOfBirth: string
  gradeApplying: string; parentName: string; parentPhone: string; parentEmail: string
  status: string; notes: string; createdAt: string
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fef9c3', color: '#92400e', label: 'قيد المراجعة' },
  accepted: { bg: '#f0fdf4', color: '#15803d', label: 'مقبول' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'مرفوض' },
}

export default function ApplicationsAdmin() {
  const [apps, setApps] = useState<Application[]>([])
  const [filter, setFilter] = useState('all')
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  async function load() {
    const d = await fetch('/api/admin/applications').then(r => r.json())
    setApps(d.applications ?? [])
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(id: number, status: string) {
    // Optimistic update — UI changes instantly
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      showToast(status === 'accepted' ? '✅ تم قبول الطلب وإرسال البريد الإلكتروني' : '❌ تم رفض الطلب', status === 'accepted')
    } catch {
      // Revert on failure
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a))
      showToast('حدث خطأ، يرجى المحاولة مرة أخرى', false)
    } finally {
      setLoadingId(null)
    }
  }

  async function del(id: number) {
    if (!confirm('حذف هذا الطلب؟')) return
    setApps(prev => prev.filter(a => a.id !== id))
    try {
      await fetch(`/api/admin/applications/${id}`, { method: 'DELETE' })
    } catch {
      load() // Reload on error
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
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#0a5c36' : '#dc2626', color: 'white',
          padding: '12px 24px', borderRadius: '999px', fontWeight: 600,
          fontSize: '0.95rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>📝 طلبات التسجيل</h1>
        <button onClick={load} style={{ marginRight: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontFamily: 'inherit' }}>🔄 تحديث</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { key: 'all', label: 'الكل', color: '#0a5c36' },
          { key: 'pending', label: 'قيد المراجعة', color: '#d97706' },
          { key: 'accepted', label: 'مقبول', color: '#16a34a' },
          { key: 'rejected', label: 'مرفوض', color: '#dc2626' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            style={{ background: filter === s.key ? s.color : 'white', color: filter === s.key ? 'white' : s.color, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', transition: 'all 0.15s' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{counts[s.key as keyof typeof counts]}</div>
            <div style={{ fontSize: '0.8rem' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(app => (
          <div key={app.id} style={{
            background: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #e2e8f0',
            opacity: loadingId === app.id ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{app.studentNameAr}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                  {app.gradeApplying} · {app.parentName} · {app.parentPhone}
                  {app.parentEmail && ` · ${app.parentEmail}`}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>
                  تاريخ الميلاد: {app.dateOfBirth} · تقديم: {new Date(app.createdAt).toLocaleDateString('ar-EG')}
                </div>
                {app.notes && <div style={{ marginTop: '8px', color: '#475569', fontSize: '0.85rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>{app.notes}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, background: statusColors[app.status]?.bg, color: statusColors[app.status]?.color, transition: 'all 0.15s' }}>
                  {loadingId === app.id ? '...' : statusColors[app.status]?.label}
                </span>
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => updateStatus(app.id, 'accepted')}
                      disabled={loadingId === app.id}
                      style={{ padding: '6px 14px', borderRadius: '6px', background: '#0a5c36', color: 'white', border: 'none', cursor: loadingId === app.id ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                      ✅ قبول
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, 'rejected')}
                      disabled={loadingId === app.id}
                      style={{ padding: '6px 14px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', cursor: loadingId === app.id ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                      ❌ رفض
                    </button>
                  </div>
                )}
                <button onClick={() => del(app.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#94a3b8', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>حذف</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '12px' }}>لا توجد طلبات</div>}
      </div>
    </div>
  )
}
