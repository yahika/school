'use client'
import { useState, useEffect } from 'react'

interface StaffMember {
  id: number
  username: string
  name: string
  department: string
  isActive: boolean
  createdAt: string
}

const DEPARTMENTS = [
  { value: 'student_affairs',  labelAr: 'شؤون الطلبة',                 icon: '🎓' },
  { value: 'buses',            labelAr: 'الباصات',                      icon: '🚌' },
  { value: 'accounts',         labelAr: 'حسابات الماليات',              icon: '💰' },
  { value: 'results_control',  labelAr: 'كونترول النتائج',              icon: '📋' },
  { value: 'inventory',        labelAr: 'المخازن والكتب واليونيفورم',   icon: '📦' },
  { value: 'owner',            labelAr: 'صاحب المدرسة',                 icon: '👑' },
]
const deptInfo = (v: string) => DEPARTMENTS.find(d => d.value === v) ?? { value: v, labelAr: v, icon: '🏷️' }

const inputStyle: React.CSSProperties = { padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }

export default function StaffAdminPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // form state
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [fName, setFName] = useState('')
  const [fUsername, setFUsername] = useState('')
  const [fPassword, setFPassword] = useState('')
  const [fDepartment, setFDepartment] = useState('student_affairs')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    setLoading(true)
    fetch('/api/admin/staff').then(r => r.json()).then(d => { setStaff(d.staff ?? []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  function flash(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function openCreate() {
    setEditing(null); setFName(''); setFUsername(''); setFPassword(''); setFDepartment('student_affairs')
    setFormError(''); setShowForm(true)
  }
  function openEdit(s: StaffMember) {
    setEditing(s); setFName(s.name); setFUsername(s.username); setFPassword(''); setFDepartment(s.department)
    setFormError(''); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditing(null) }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!fName.trim() || (!editing && !fUsername.trim())) { setFormError('من فضلك أكمل البيانات المطلوبة'); return }
    if (!editing && fPassword.length < 6) { setFormError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (editing && fPassword && fPassword.length < 6) { setFormError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'); return }

    setSaving(true)
    try {
      let res: Response
      if (editing) {
        const body: Record<string, unknown> = { name: fName.trim(), department: fDepartment }
        if (fPassword) body.password = fPassword
        res = await fetch(`/api/admin/staff/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/admin/staff', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fName.trim(), username: fUsername.trim(), password: fPassword, department: fDepartment }),
        })
      }
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'حدث خطأ'); setSaving(false); return }

      flash('success', editing ? 'تم تحديث بيانات الحساب' : `تم إنشاء حساب "${fName.trim()}" بنجاح`)
      closeForm()
      load()
    } catch {
      setFormError('تعذّر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: StaffMember) {
    const res = await fetch(`/api/admin/staff/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !s.isActive }),
    })
    if (res.ok) { flash('success', s.isActive ? `تم إيقاف حساب "${s.name}"` : `تم تفعيل حساب "${s.name}"`); load() }
    else flash('error', 'تعذّر تنفيذ العملية')
  }

  async function removeStaff(s: StaffMember) {
    if (!confirm(`هل أنت متأكد من حذف حساب "${s.name}" (${s.username})؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    const res = await fetch(`/api/admin/staff/${s.id}`, { method: 'DELETE' })
    if (res.ok) { flash('success', `تم حذف حساب "${s.name}"`); load() }
    else flash('error', 'تعذّر حذف الحساب')
  }

  const filtered = staff.filter(s =>
    s.name.includes(search) || s.username.toLowerCase().includes(search.toLowerCase()) || deptInfo(s.department).labelAr.includes(search)
  )

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>🗝️ حسابات العاملين بالمدرسة</h1>
        <span style={{ background: '#f0fdf4', color: '#0a5c36', fontWeight: 700, fontSize: '0.85rem', padding: '4px 14px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>{staff.length} حساب</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو اسم المستخدم أو القسم"
          style={{ marginInlineStart: 'auto', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem', minWidth: '260px' }} />
        <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ إضافة حساب جديد</button>
      </div>

      <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '-16px', marginBottom: '22px', lineHeight: 1.8 }}>
        من هنا تنشئ حساب دخول مستقل (اسم مستخدم + كلمة مرور) لكل قسم من الأقسام الخمسة. كل عضو يسجّل دخوله من{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>/staff/login</code>
        {' '}وسيُنقل تلقائيًا إلى صفحة قسمه فقط.
      </p>

      {toast && (
        <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 360px' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '14px' }}>جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗝️</div>
              {search ? 'لا توجد نتائج مطابقة' : 'لا توجد حسابات بعد — أنشئ أول حساب لأحد الأقسام'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(s => {
                const info = deptInfo(s.department)
                return (
                  <div key={s.id} style={{
                    background: 'white', borderRadius: '12px', padding: '16px 20px',
                    border: editing?.id === s.id ? '2px solid #0a5c36' : '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                  }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
                      {info.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{s.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>@{s.username}</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: '999px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', whiteSpace: 'nowrap' }}>
                      {info.labelAr}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, background: s.isActive ? '#f0fdf4' : '#fef2f2', color: s.isActive ? '#15803d' : '#dc2626' }}>
                      {s.isActive ? '✓ مُفعّل' : '⏸ مُوقَف'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(s)} className="btn-outline btn-sm">تعديل</button>
                      <button onClick={() => toggleActive(s)} className="btn-sm" style={{ border: '1px solid #d97706', color: '#d97706', background: 'white', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem' }}>
                        {s.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button onClick={() => removeStaff(s)} className="btn-danger btn-sm">حذف</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ position: 'sticky', top: '24px' }}>
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#0a5c36', fontSize: '1.05rem', fontWeight: 800 }}>
                  {editing ? '✏️ تعديل حساب' : '➕ حساب جديد'}
                </h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>✕</button>
              </div>
              <form onSubmit={submitForm}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>الاسم الكامل</label>
                  <input style={inputStyle} value={fName} onChange={e => setFName(e.target.value)} placeholder="مثال: أحمد محمد" />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>اسم المستخدم {editing && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(لا يمكن تغييره)</span>}</label>
                  <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', background: editing ? '#f1f5f9' : 'white' }}
                    value={fUsername} onChange={e => setFUsername(e.target.value)} placeholder="username" disabled={!!editing} autoComplete="off" />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>{editing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</label>
                  <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} type="text" value={fPassword} onChange={e => setFPassword(e.target.value)}
                    placeholder={editing ? 'اتركه فارغًا لعدم التغيير' : '6 أحرف على الأقل'} autoComplete="off" />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>القسم</label>
                  <select style={inputStyle} value={fDepartment} onChange={e => setFDepartment(e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.icon} {d.labelAr}</option>)}
                  </select>
                </div>

                {formError && (
                  <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                    {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : editing ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                  </button>
                  <button type="button" onClick={closeForm} className="btn-outline">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
