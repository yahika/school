'use client'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'fleet' | 'riders'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'fleet', label: 'الباصات' },
  { key: 'riders', label: 'الركاب' },
]

const BUS_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'نشط', color: '#15803d', bg: '#f0fdf4' },
  maintenance: { label: 'صيانة', color: '#d97706', bg: '#fffbeb' },
  inactive: { label: 'متوقف', color: '#dc2626', bg: '#fef2f2' },
}

// ---------- shared bits ----------
function Loading() {
  return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}><span className="spinner" /> جارٍ التحميل...</div>
}
function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
      <div style={{ fontSize: '2.6rem', marginBottom: '10px' }}>{icon}</div>
      {text}
    </div>
  )
}
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: (color ?? '#0a5c36') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: color ?? '#0f172a', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{label}{sub ? <span style={{ color: '#94a3b8' }}> · {sub}</span> : null}</div>
      </div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ marginBottom: '14px' }}><label className="form-label">{label}</label>{children}</div>
}

// ============================================================
// Overview
// ============================================================
interface BusOverview {
  totalBuses: number
  byStatus: Record<string, number>
  totalRiders: number
  totalCapacity: number
  utilization: number
  gradeBreakdown: { gradeAr: string; count: number }[]
  fleet: { id: number; code: string; driverName: string | null; routeAr: string | null; status: string; capacity: number; riderCount: number }[]
}

function OverviewTab() {
  const [data, setData] = useState<BusOverview | null>(null)
  useEffect(() => { fetch('/api/staff/buses/overview').then(r => r.json()).then(setData) }, [])
  if (!data) return <Loading />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <StatCard icon="🚌" label="إجمالي الباصات" value={data.totalBuses} />
        <StatCard icon="🟢" label="باصات نشطة" value={data.byStatus.active ?? 0} color="#15803d" />
        <StatCard icon="🧑‍🤝‍🧑" label="إجمالي الركاب" value={data.totalRiders} sub={`من سعة ${data.totalCapacity}`} color="#2563eb" />
        <StatCard icon="📊" label="نسبة الإشغال" value={`${data.utilization}%`} color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🚦 حالة الأسطول</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['active', 'maintenance', 'inactive'] as const).map(k => {
              const v = data.byStatus[k] ?? 0; const m = BUS_STATUS_META[k]
              const pct = data.totalBuses ? Math.round((v / data.totalBuses) * 100) : 0
              return (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: m.color }}>{m.label}</span>
                    <span style={{ color: '#64748b' }}>{v} باص</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '999px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🏫 الركاب حسب الصف</div>
          {data.gradeBreakdown.length === 0 ? <Empty icon="🧑‍🤝‍🧑" text="لا يوجد ركاب مسجلون بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.gradeBreakdown.map(g => (
                <div key={g.gradeAr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.88rem' }}>{g.gradeAr}</span>
                  <span style={{ fontWeight: 800, color: '#0a5c36', fontSize: '0.9rem' }}>{g.count} طالب</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🚌 الأسطول — نسبة الإشغال لكل باص</div>
        {data.fleet.length === 0 ? <Empty icon="🚌" text="لا توجد باصات بعد — أضف أول باص من تبويب «الباصات»" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.fleet.map(b => {
              const m = BUS_STATUS_META[b.status] ?? BUS_STATUS_META.active
              const pct = b.capacity > 0 ? Math.min(100, Math.round((b.riderCount / b.capacity) * 100)) : 0
              return (
                <div key={b.id} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#374151' }}>🚌 {b.code} <span style={{ color: '#94a3b8', fontWeight: 500 }}>· {b.driverName ?? 'بلا سائق'}{b.routeAr ? ` · ${b.routeAr}` : ''}</span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.riderCount}/{b.capacity || '∞'}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#0a5c36', borderRadius: '999px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Fleet (Buses CRUD)
// ============================================================
interface BusRow {
  id: number; code: string; plateNumber: string | null; driverName: string | null; driverPhone: string | null
  supervisorName: string | null; supervisorPhone: string | null; capacity: number
  routeAr: string | null; routeEn: string | null; stops: string | null; monthlyFee: number | null
  status: string; notes: string | null; riderCount: number
}
type BusForm = {
  code: string; plateNumber: string; driverName: string; driverPhone: string
  supervisorName: string; supervisorPhone: string; capacity: string
  routeAr: string; routeEn: string; stops: string; monthlyFee: string; status: string; notes: string
}
const EMPTY_BUS_FORM: BusForm = {
  code: '', plateNumber: '', driverName: '', driverPhone: '', supervisorName: '', supervisorPhone: '',
  capacity: '', routeAr: '', routeEn: '', stops: '', monthlyFee: '', status: 'active', notes: '',
}
function busToForm(b: BusRow): BusForm {
  return {
    code: b.code, plateNumber: b.plateNumber ?? '', driverName: b.driverName ?? '', driverPhone: b.driverPhone ?? '',
    supervisorName: b.supervisorName ?? '', supervisorPhone: b.supervisorPhone ?? '', capacity: String(b.capacity ?? ''),
    routeAr: b.routeAr ?? '', routeEn: b.routeEn ?? '', stops: b.stops ?? '', monthlyFee: b.monthlyFee != null ? String(b.monthlyFee) : '',
    status: b.status, notes: b.notes ?? '',
  }
}

function FleetTab({ notify, onManageRiders }: { notify: Notify; onManageRiders: (busId: number) => void }) {
  const [buses, setBuses] = useState<BusRow[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BusRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BusForm>(EMPTY_BUS_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (status) qs.set('status', status)
    fetch(`/api/staff/buses?${qs.toString()}`).then(r => r.json()).then(d => { setBuses(d.buses ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search, status])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY_BUS_FORM); setShowForm(true) }
  function openEdit(b: BusRow) { setEditing(b); setForm(busToForm(b)); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_BUS_FORM) }
  function set<K extends keyof BusForm>(key: K, value: BusForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.driverName.trim()) { notify('كود الباص واسم السائق حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/staff/buses/${editing.id}` : '/api/staff/buses'
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'حدث خطأ غير متوقع', 'error'); return }
      notify(editing ? 'تم حفظ تعديلات الباص' : 'تمت إضافة الباص بنجاح')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  async function remove(b: BusRow) {
    if (!confirm(`هل تريد حذف الباص «${b.code}»؟ سيتم حذف كل الركاب المسجلين عليه أيضًا — لا يمكن التراجع.`)) return
    const res = await fetch(`/api/staff/buses/${b.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تم حذف الباص'); if (editing?.id === b.id) closeForm(); load() }
    else notify('تعذّر حذف الباص', 'error')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 420px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالكود أو السائق أو خط السير"
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <select value={status} onChange={e => setStatus(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="maintenance">صيانة</option>
            <option value="inactive">متوقف</option>
          </select>
          <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ باص جديد</button>
        </div>

        {loading ? <Loading /> : buses.length === 0 ? (
          <Empty icon="🚌" text={search || status ? 'لا توجد باصات مطابقة' : 'لا توجد باصات بعد — أضف أول باص'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {buses.map(b => {
              const m = BUS_STATUS_META[b.status] ?? BUS_STATUS_META.active
              return (
                <div key={b.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: editing?.id === b.id ? '2px solid #0a5c36' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>🚌</div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{b.code} {b.plateNumber ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>· {b.plateNumber}</span> : null}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                      {b.driverName ? `🧑‍✈️ ${b.driverName}` : 'بلا سائق'}{b.driverPhone ? ` (${b.driverPhone})` : ''}{b.routeAr ? ` · 🗺️ ${b.routeAr}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0a5c36' }}>{b.riderCount}/{b.capacity || '∞'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>راكب</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => onManageRiders(b.id)} className="btn-outline btn-sm">👥 الركاب</button>
                    <button onClick={() => openEdit(b)} className="btn-outline btn-sm">تعديل</button>
                    <button onClick={() => remove(b)} className="btn-danger btn-sm">حذف</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="card" style={{ padding: '22px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{editing ? `تعديل باص: ${editing.code}` : 'باص جديد'}</div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="كود الباص *"><input className="form-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="مثال: B-12" /></Field>
                <Field label="رقم اللوحة"><input className="form-input" value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} /></Field>
                <Field label="اسم السائق *"><input className="form-input" value={form.driverName} onChange={e => set('driverName', e.target.value)} /></Field>
                <Field label="هاتف السائق"><input className="form-input" value={form.driverPhone} onChange={e => set('driverPhone', e.target.value)} /></Field>
                <Field label="اسم المشرف"><input className="form-input" value={form.supervisorName} onChange={e => set('supervisorName', e.target.value)} /></Field>
                <Field label="هاتف المشرف"><input className="form-input" value={form.supervisorPhone} onChange={e => set('supervisorPhone', e.target.value)} /></Field>
                <Field label="السعة (عدد الركاب)"><input className="form-input" type="number" min="0" value={form.capacity} onChange={e => set('capacity', e.target.value)} /></Field>
                <Field label="الاشتراك الشهري (جنيه)"><input className="form-input" type="number" min="0" step="0.01" value={form.monthlyFee} onChange={e => set('monthlyFee', e.target.value)} /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="خط السير (عربي)"><input className="form-input" value={form.routeAr} onChange={e => set('routeAr', e.target.value)} /></Field>
                <Field label="خط السير (إنجليزي)"><input className="form-input" value={form.routeEn} onChange={e => set('routeEn', e.target.value)} /></Field>
              </div>
              <Field label="نقاط التوقف"><textarea className="form-input" rows={2} value={form.stops} onChange={e => set('stops', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="نقطة 1، نقطة 2، ..." /></Field>
              <Field label="الحالة">
                <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">نشط</option>
                  <option value="maintenance">صيانة</option>
                  <option value="inactive">متوقف</option>
                </select>
              </Field>
              <Field label="ملاحظات"><textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : editing ? 'حفظ التعديلات' : 'إضافة الباص'}
                </button>
                <button type="button" onClick={closeForm} className="btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Riders
// ============================================================
interface RiderRow { id: number; busId: number; seatNumber: string; studentName: string; gradeAr: string; pickupPoint: string | null; phone: string | null; isActive: boolean }
type RiderForm = { seatNumber: string; studentName: string; gradeAr: string; pickupPoint: string; phone: string }
const EMPTY_RIDER_FORM: RiderForm = { seatNumber: '', studentName: '', gradeAr: '', pickupPoint: '', phone: '' }

function RidersTab({ notify, selectedBusId, setSelectedBusId }: { notify: Notify; selectedBusId: number | null; setSelectedBusId: (id: number | null) => void }) {
  const [buses, setBuses] = useState<BusRow[]>([])
  const [riders, setRiders] = useState<RiderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<RiderForm>(EMPTY_RIDER_FORM)
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const bus = buses.find(b => b.id === selectedBusId) ?? null

  const loadBuses = useCallback(() => { fetch('/api/staff/buses').then(r => r.json()).then(d => setBuses(d.buses ?? [])) }, [])
  useEffect(() => { loadBuses() }, [loadBuses])

  const load = useCallback(() => {
    if (!selectedBusId) { setRiders([]); return }
    setLoading(true)
    fetch(`/api/staff/buses/riders?busId=${selectedBusId}`).then(r => r.json()).then(d => { setRiders(d.riders ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [selectedBusId])
  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY_RIDER_FORM); setShowForm(true) }
  function closeForm() { setShowForm(false); setForm(EMPTY_RIDER_FORM) }
  function set<K extends keyof RiderForm>(key: K, value: RiderForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function lookupSeat() {
    const seat = form.seatNumber.trim()
    if (!seat) { notify('اكتب رقم الجلوس أولاً', 'error'); return }
    setLooking(true)
    try {
      const d = await fetch(`/api/staff/buses/lookup?seat=${encodeURIComponent(seat)}`).then(r => r.json())
      if (d.found) {
        setForm(f => ({ ...f, studentName: d.student.nameAr ?? f.studentName, gradeAr: d.student.gradeAr ?? f.gradeAr }))
        notify(d.currentBusCode ? `تنبيه: هذا الطالب مسجَّل بالفعل على متن الباص ${d.currentBusCode}` : 'تم العثور على الطالب وتعبئة بياناته', d.currentBusCode ? 'error' : 'success')
      } else notify('لم يتم العثور على رقم الجلوس — أكمل البيانات يدويًا', 'error')
    } finally { setLooking(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBusId) return
    if (!form.seatNumber.trim() || !form.studentName.trim() || !form.gradeAr.trim()) { notify('رقم الجلوس واسم الطالب والصف حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/staff/buses/riders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, busId: selectedBusId }) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر إضافة الراكب', 'error'); return }
      notify('تمت إضافة الراكب بنجاح')
      closeForm(); load(); loadBuses()
    } finally { setSaving(false) }
  }

  async function remove(r: RiderRow) {
    if (!confirm(`إزالة ${r.studentName} من هذا الباص؟`)) return
    const res = await fetch(`/api/staff/buses/riders/${r.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تمت إزالة الراكب'); load(); loadBuses() } else notify('تعذّر الحذف', 'error')
  }

  return (
    <div>
      <div className="card" style={{ padding: '18px 20px', marginBottom: '18px', display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <Field label="اختر الباص">
          <select className="form-input" value={selectedBusId ?? ''} onChange={e => setSelectedBusId(e.target.value ? parseInt(e.target.value) : null)} style={{ minWidth: '260px' }}>
            <option value="">— اختر باصًا —</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.code}{b.routeAr ? ` · ${b.routeAr}` : ''} ({b.riderCount}/{b.capacity || '∞'})</option>)}
          </select>
        </Field>
        {bus && (
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', color: '#64748b', fontSize: '0.82rem' }}>
            <span>🧑‍✈️ السائق: <strong style={{ color: '#374151' }}>{bus.driverName ?? '—'}</strong></span>
            <span>🗺️ خط السير: <strong style={{ color: '#374151' }}>{bus.routeAr ?? '—'}</strong></span>
            <span>💺 الإشغال: <strong style={{ color: '#374151' }}>{bus.riderCount}/{bus.capacity || '∞'}</strong></span>
          </div>
        )}
        {bus && <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap', marginInlineStart: 'auto' }}>+ إضافة راكب</button>}
      </div>

      {!selectedBusId ? (
        <Empty icon="🚌" text="اختر باصًا من القائمة أعلاه لعرض وإدارة ركّابه" />
      ) : loading ? <Loading /> : (
        <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            {riders.length === 0 ? <Empty icon="🧑‍🤝‍🧑" text="لا يوجد ركاب على متن هذا الباص بعد" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {riders.map(r => (
                  <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{r.seatNumber}</div>
                    <div style={{ flex: '1 1 160px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{r.studentName}</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{r.gradeAr}{r.pickupPoint ? ` · 📍 ${r.pickupPoint}` : ''}{r.phone ? ` · ${r.phone}` : ''}</div>
                    </div>
                    <button onClick={() => remove(r)} className="btn-danger btn-sm">إزالة</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showForm && (
            <div style={{ position: 'sticky', top: '24px' }}>
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>إضافة راكب إلى {bus?.code}</div>
                  <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
                </div>
                <form onSubmit={submit}>
                  <Field label="رقم الجلوس *">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="form-input" value={form.seatNumber} onChange={e => set('seatNumber', e.target.value)} placeholder="مثال: 1023" />
                      <button type="button" onClick={lookupSeat} disabled={looking} className="btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>{looking ? '...' : '🔍 بحث'}</button>
                    </div>
                  </Field>
                  <Field label="اسم الطالب *"><input className="form-input" value={form.studentName} onChange={e => set('studentName', e.target.value)} /></Field>
                  <Field label="الصف *"><input className="form-input" value={form.gradeAr} onChange={e => set('gradeAr', e.target.value)} /></Field>
                  <Field label="نقطة الركوب"><input className="form-input" value={form.pickupPoint} onChange={e => set('pickupPoint', e.target.value)} /></Field>
                  <Field label="رقم الهاتف"><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? <><span className="spinner" /> جارٍ الحفظ...</> : 'إضافة الراكب'}</button>
                    <button type="button" onClick={closeForm} className="btn-outline">إلغاء</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Page shell
// ============================================================
export default function BusesPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const notify: Notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  function manageRiders(busId: number) { setSelectedBusId(busId); setTab('riders') }

  return (
    <StaffShell title="باصات" icon="🚌" tabs={TABS} active={tab} onTabChange={k => setTab(k as TabKey)}>
      {toast && <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}</div>}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'fleet' && <FleetTab notify={notify} onManageRiders={manageRiders} />}
      {tab === 'riders' && <RidersTab notify={notify} selectedBusId={selectedBusId} setSelectedBusId={setSelectedBusId} />}
    </StaffShell>
  )
}
