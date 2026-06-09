'use client'
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import StaffShell from '../_components/StaffShell'
import * as XLSX from 'xlsx'

type TabKey = 'overview' | 'files' | 'attendance' | 'conduct' | 'import' | 'certificates'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',      label: 'نظرة عامة' },
  { key: 'files',         label: 'ملفات الطلاب' },
  { key: 'attendance',    label: 'الحضور والغياب' },
  { key: 'conduct',       label: 'السلوك' },
  { key: 'import',        label: '📥 استيراد Excel' },
  { key: 'certificates',  label: '📄 الشهادات' },
]

function todayStr() { return new Date().toISOString().slice(0, 10) }

const ATTENDANCE_META: Record<string, { label: string; color: string; bg: string }> = {
  present: { label: 'حاضر', color: '#15803d', bg: '#f0fdf4' },
  absent: { label: 'غائب', color: '#dc2626', bg: '#fef2f2' },
  late: { label: 'متأخر', color: '#d97706', bg: '#fffbeb' },
  excused: { label: 'مستأذن', color: '#2563eb', bg: '#eff6ff' },
}
const CONDUCT_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  positive: { label: 'إيجابية', color: '#15803d', bg: '#f0fdf4', icon: '⭐' },
  negative: { label: 'سلبية', color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
  note: { label: 'ملاحظة', color: '#475569', bg: '#f1f5f9', icon: '📝' },
}
const FILE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'نشط', color: '#15803d', bg: '#f0fdf4' },
  transferred: { label: 'منقول', color: '#2563eb', bg: '#eff6ff' },
  graduated: { label: 'متخرج', color: '#7c3aed', bg: '#f5f3ff' },
  suspended: { label: 'موقوف', color: '#dc2626', bg: '#fef2f2' },
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
interface OverviewData {
  totalStudents: number; totalFiles: number; activeFiles: number
  gradeBreakdown: { gradeAr: string; count: number }[]
  today: string
  attendanceSummary: { present: number; absent: number; late: number; excused: number }
  attendanceTaken: number
  recentConduct: { id: number; seatNumber: string; studentName: string; gradeAr: string; type: string; description: string; date: string; recordedBy: string | null }[]
  recentFiles: { seatNumber: string; nameAr: string; gradeAr: string; status: string }[]
}

function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null)
  useEffect(() => { fetch('/api/staff/student-affairs/overview').then(r => r.json()).then(setData) }, [])
  if (!data) return <Loading />

  const attTotal = data.attendanceSummary.present + data.attendanceSummary.absent + data.attendanceSummary.late + data.attendanceSummary.excused

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <StatCard icon="🎓" label="إجمالي الطلاب (من النتائج)" value={data.totalStudents} />
        <StatCard icon="📁" label="ملفات شؤون الطلبة" value={data.totalFiles} sub={`${data.activeFiles} نشط`} color="#0a5c36" />
        <StatCard icon="🗓️" label={`حضور اليوم`} value={data.attendanceTaken} sub={`من ${data.totalStudents} · ${data.today}`} color="#2563eb" />
        <StatCard icon="📋" label="ملاحظات سلوك حديثة" value={data.recentConduct.length} color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📊 ملخص حضور اليوم</div>
          {attTotal === 0 ? <Empty icon="🗓️" text="لم يُسجَّل حضور اليوم بعد — افتح تبويب «الحضور والغياب»" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['present', 'absent', 'late', 'excused'] as const).map(k => {
                const v = data.attendanceSummary[k]; const m = ATTENDANCE_META[k]
                const pct = attTotal ? Math.round((v / attTotal) * 100) : 0
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: m.color }}>{m.label}</span>
                      <span style={{ color: '#64748b' }}>{v} طالب</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🏫 توزيع الطلاب على الصفوف</div>
          {data.gradeBreakdown.length === 0 ? <Empty icon="🏫" text="لا توجد بيانات صفوف بعد" /> : (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📋 أحدث ملاحظات السلوك</div>
          {data.recentConduct.length === 0 ? <Empty icon="📋" text="لا توجد ملاحظات سلوك بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recentConduct.map(c => {
                const m = CONDUCT_META[c.type] ?? CONDUCT_META.note
                return (
                  <div key={c.id} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>{c.studentName} <span style={{ color: '#94a3b8', fontWeight: 500 }}>· {c.gradeAr}</span></span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.icon} {m.label}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{c.description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>{c.date}{c.recordedBy ? ` · سجّلها ${c.recordedBy}` : ''}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📁 أحدث الملفات المضافة</div>
          {data.recentFiles.length === 0 ? <Empty icon="📁" text="لا توجد ملفات طلاب بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recentFiles.map(f => {
                const m = FILE_STATUS_META[f.status] ?? FILE_STATUS_META.active
                return (
                  <div key={f.seatNumber} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>{f.nameAr}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> · {f.gradeAr} · {f.seatNumber}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Student Files
// ============================================================
interface StudentFileRow {
  id: number; seatNumber: string; nameAr: string; nameEn: string | null; gradeAr: string; gradeEn: string | null
  nationalId: string | null; dateOfBirth: string | null; address: string | null
  guardianName: string | null; guardianPhone: string | null; guardianRelation: string | null; emergencyPhone: string | null
  medicalNotes: string | null; enrollDate: string | null; status: string; notes: string | null
}
type FileForm = {
  seatNumber: string; nameAr: string; nameEn: string; gradeAr: string; gradeEn: string
  nationalId: string; dateOfBirth: string; address: string
  guardianName: string; guardianPhone: string; guardianRelation: string; emergencyPhone: string
  medicalNotes: string; enrollDate: string; status: string; notes: string
}
const EMPTY_FILE_FORM: FileForm = {
  seatNumber: '', nameAr: '', nameEn: '', gradeAr: '', gradeEn: '', nationalId: '', dateOfBirth: '', address: '',
  guardianName: '', guardianPhone: '', guardianRelation: '', emergencyPhone: '', medicalNotes: '', enrollDate: '', status: 'active', notes: '',
}
function fileToForm(f: StudentFileRow): FileForm {
  return {
    seatNumber: f.seatNumber, nameAr: f.nameAr, nameEn: f.nameEn ?? '', gradeAr: f.gradeAr, gradeEn: f.gradeEn ?? '',
    nationalId: f.nationalId ?? '', dateOfBirth: f.dateOfBirth ?? '', address: f.address ?? '',
    guardianName: f.guardianName ?? '', guardianPhone: f.guardianPhone ?? '', guardianRelation: f.guardianRelation ?? '', emergencyPhone: f.emergencyPhone ?? '',
    medicalNotes: f.medicalNotes ?? '', enrollDate: f.enrollDate ?? '', status: f.status, notes: f.notes ?? '',
  }
}

function FilesTab({ notify }: { notify: Notify }) {
  const [files, setFiles] = useState<StudentFileRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StudentFileRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FileForm>(EMPTY_FILE_FORM)
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/staff/student-affairs/students?search=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(d => { setFiles(d.files ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY_FILE_FORM); setShowForm(true) }
  function openEdit(f: StudentFileRow) { setEditing(f); setForm(fileToForm(f)); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FILE_FORM) }
  function set<K extends keyof FileForm>(key: K, value: FileForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function lookupSeat() {
    const seat = form.seatNumber.trim()
    if (!seat) { notify('اكتب رقم الجلوس أولاً', 'error'); return }
    setLooking(true)
    try {
      const d = await fetch(`/api/staff/student-affairs/lookup?seat=${encodeURIComponent(seat)}`).then(r => r.json())
      if (d.found) {
        setForm(f => ({ ...f, nameAr: d.student.nameAr ?? f.nameAr, nameEn: d.student.nameEn ?? f.nameEn, gradeAr: d.student.gradeAr ?? f.gradeAr, gradeEn: d.student.gradeEn ?? f.gradeEn, dateOfBirth: d.student.dateOfBirth ?? f.dateOfBirth }))
        notify(d.hasFile && !editing ? 'تنبيه: يوجد ملف بهذا الرقم بالفعل — تم تعبئة البيانات من سجل النتائج' : 'تم العثور على الطالب وتعبئة بياناته تلقائيًا', d.hasFile && !editing ? 'error' : 'success')
      } else notify('لم يتم العثور على رقم الجلوس في سجل النتائج — أكمل البيانات يدويًا', 'error')
    } finally { setLooking(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.seatNumber.trim() || !form.nameAr.trim() || !form.gradeAr.trim()) { notify('رقم الجلوس والاسم والصف حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/staff/student-affairs/students/${editing.id}` : '/api/staff/student-affairs/students'
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'حدث خطأ غير متوقع', 'error'); return }
      notify(editing ? 'تم حفظ تعديلات الملف' : 'تم إنشاء ملف الطالب بنجاح')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  async function remove(f: StudentFileRow) {
    if (!confirm(`هل تريد حذف ملف الطالب «${f.nameAr}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    const res = await fetch(`/api/staff/student-affairs/students/${f.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تم حذف الملف'); if (editing?.id === f.id) closeForm(); load() }
    else notify('تعذّر حذف الملف', 'error')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 420px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس أو الصف"
            style={{ flex: 1, minWidth: '220px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{files.length} ملف</span>
          <button onClick={openCreate} className="btn-primary">+ ملف طالب جديد</button>
        </div>

        {loading ? <Loading /> : files.length === 0 ? (
          <Empty icon="📁" text={search ? 'لا توجد ملفات مطابقة لبحثك' : 'لا توجد ملفات طلاب بعد — أنشئ أول ملف'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map(f => {
              const m = FILE_STATUS_META[f.status] ?? FILE_STATUS_META.active
              return (
                <div key={f.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: editing?.id === f.id ? '2px solid #0a5c36' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.76rem', flexShrink: 0 }}>{f.seatNumber}</div>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{f.nameAr}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>{f.gradeAr}{f.guardianName ? ` · ولي الأمر: ${f.guardianName}` : ''}{f.guardianPhone ? ` · ${f.guardianPhone}` : ''}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(f)} className="btn-outline btn-sm">تعديل</button>
                    <button onClick={() => remove(f)} className="btn-danger btn-sm">حذف</button>
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
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{editing ? `تعديل ملف: ${editing.nameAr}` : 'ملف طالب جديد'}</div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={submit}>
              <Field label="رقم الجلوس *">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="form-input" value={form.seatNumber} disabled={!!editing} onChange={e => set('seatNumber', e.target.value)} placeholder="مثال: 1023" />
                  {!editing && <button type="button" onClick={lookupSeat} disabled={looking} className="btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>{looking ? '...' : '🔍 بحث وتعبئة'}</button>}
                </div>
                {!editing && <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>يبحث في سجلات النتائج لتعبئة الاسم والصف تلقائيًا</div>}
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="الاسم بالعربية *"><input className="form-input" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} /></Field>
                <Field label="الاسم بالإنجليزية"><input className="form-input" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} /></Field>
                <Field label="الصف بالعربية *"><input className="form-input" value={form.gradeAr} onChange={e => set('gradeAr', e.target.value)} /></Field>
                <Field label="الصف بالإنجليزية"><input className="form-input" value={form.gradeEn} onChange={e => set('gradeEn', e.target.value)} /></Field>
                <Field label="الرقم القومي"><input className="form-input" value={form.nationalId} onChange={e => set('nationalId', e.target.value)} /></Field>
                <Field label="تاريخ الميلاد"><input className="form-input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></Field>
              </div>
              <Field label="العنوان"><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="اسم ولي الأمر"><input className="form-input" value={form.guardianName} onChange={e => set('guardianName', e.target.value)} /></Field>
                <Field label="صلة القرابة"><input className="form-input" value={form.guardianRelation} onChange={e => set('guardianRelation', e.target.value)} placeholder="أب / أم / ولي أمر" /></Field>
                <Field label="هاتف ولي الأمر"><input className="form-input" value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} /></Field>
                <Field label="هاتف للطوارئ"><input className="form-input" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} /></Field>
              </div>
              <Field label="ملاحظات طبية"><textarea className="form-input" rows={2} value={form.medicalNotes} onChange={e => set('medicalNotes', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="تاريخ الالتحاق"><input className="form-input" type="date" value={form.enrollDate} onChange={e => set('enrollDate', e.target.value)} /></Field>
                <Field label="حالة الملف">
                  <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="active">نشط</option>
                    <option value="transferred">منقول</option>
                    <option value="graduated">متخرج</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </Field>
              </div>
              <Field label="ملاحظات عامة"><textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : editing ? 'حفظ التعديلات' : 'إنشاء الملف'}
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
// Attendance
// ============================================================
interface AttendanceRow { seatNumber: string; studentName: string; gradeAr: string; status: string; notes: string; saved: boolean }

function AttendanceTab({ notify }: { notify: Notify }) {
  const [date, setDate] = useState(todayStr())
  const [grades, setGrades] = useState<string[]>([])
  const [grade, setGrade] = useState('')
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/staff/student-affairs/roster').then(r => r.json()).then(d => {
      setGrades(d.grades ?? [])
      setGrade(g => g || (d.grades?.[0] ?? ''))
    })
  }, [])

  const load = useCallback(() => {
    if (!date || !grade) return
    setLoading(true)
    fetch(`/api/staff/student-affairs/attendance?date=${encodeURIComponent(date)}&grade=${encodeURIComponent(grade)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { notify(d.error, 'error'); setRows([]); return }
        setRows(d.rows ?? [])
        setDirty(false)
      })
      .finally(() => setLoading(false))
  }, [date, grade, notify])
  useEffect(() => { load() }, [load])

  function setStatus(seat: string, status: string) { setRows(rs => rs.map(r => r.seatNumber === seat ? { ...r, status } : r)); setDirty(true) }
  function setNote(seat: string, notes: string) { setRows(rs => rs.map(r => r.seatNumber === seat ? { ...r, notes } : r)); setDirty(true) }
  function markAll(status: string) { setRows(rs => rs.map(r => ({ ...r, status }))); setDirty(true) }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/staff/student-affairs/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, gradeAr: grade, records: rows }) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر حفظ الحضور', 'error'); return }
      notify(`تم حفظ حضور ${d.count} طالب بنجاح`)
      load()
    } finally { setSaving(false) }
  }

  const liveCounts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div>
      <div className="card" style={{ padding: '18px 20px', marginBottom: '18px', display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <Field label="التاريخ"><input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ minWidth: '160px' }} /></Field>
        <Field label="الصف">
          <select className="form-input" value={grade} onChange={e => setGrade(e.target.value)} style={{ minWidth: '180px' }}>
            {grades.length === 0 && <option value="">لا توجد صفوف</option>}
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>تحديد الكل:</span>
          {(['present', 'absent', 'late', 'excused'] as const).map(k => (
            <button key={k} type="button" onClick={() => markAll(k)} className="btn-outline btn-sm" style={{ borderColor: ATTENDANCE_META[k].color, color: ATTENDANCE_META[k].color }}>{ATTENDANCE_META[k].label}</button>
          ))}
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {(['present', 'absent', 'late', 'excused'] as const).map(k => (
            <div key={k} style={{ flex: '1 1 140px', background: ATTENDANCE_META[k].bg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${ATTENDANCE_META[k].color}22` }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: ATTENDANCE_META[k].color }}>{liveCounts[k] ?? 0}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{ATTENDANCE_META[k].label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Loading /> : rows.length === 0 ? (
        <Empty icon="🗓️" text={grade ? 'لا يوجد طلاب في هذا الصف ضمن سجلات النتائج' : 'اختر صفًا لعرض كشف الحضور'} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {rows.map(r => (
              <div key={r.seatNumber} style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{r.seatNumber}</div>
                <div style={{ flex: '1 1 160px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{r.studentName}</div>
                  {r.saved && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>محفوظ مسبقًا</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['present', 'absent', 'late', 'excused'] as const).map(k => {
                    const active = r.status === k; const m = ATTENDANCE_META[k]
                    return (
                      <button key={k} type="button" onClick={() => setStatus(r.seatNumber, k)} style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', border: `1.5px solid ${m.color}`, background: active ? m.color : 'white', color: active ? 'white' : m.color, transition: 'all 0.12s' }}>{m.label}</button>
                    )
                  })}
                </div>
                <input value={r.notes} onChange={e => setNote(r.seatNumber, e.target.value)} placeholder="ملاحظة (اختياري)" style={{ flex: '1 1 160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.8rem' }} />
              </div>
            ))}
          </div>
          <div style={{ position: 'sticky', bottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={save} disabled={saving || !dirty} className="btn-primary" style={{ boxShadow: '0 8px 24px rgba(10,92,54,0.28)', opacity: dirty ? 1 : 0.6 }}>
              {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : dirty ? `💾 حفظ حضور ${rows.length} طالب` : '✓ تم الحفظ'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// Conduct
// ============================================================
interface ConductRow { id: number; seatNumber: string; studentName: string; gradeAr: string; date: string; type: string; description: string; recordedBy: string | null }
type ConductForm = { seatNumber: string; studentName: string; gradeAr: string; date: string; type: string; description: string }
const EMPTY_CONDUCT_FORM: ConductForm = { seatNumber: '', studentName: '', gradeAr: '', date: todayStr(), type: 'positive', description: '' }

function ConductTab({ notify }: { notify: Notify }) {
  const [notes, setNotes] = useState<ConductRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ConductForm>(EMPTY_CONDUCT_FORM)
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'note'>('all')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/staff/student-affairs/conduct?search=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(d => { setNotes(d.notes ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() { setForm(EMPTY_CONDUCT_FORM); setShowForm(true) }
  function closeForm() { setShowForm(false); setForm(EMPTY_CONDUCT_FORM) }
  function set<K extends keyof ConductForm>(key: K, value: ConductForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function lookupSeat() {
    const seat = form.seatNumber.trim()
    if (!seat) { notify('اكتب رقم الجلوس أولاً', 'error'); return }
    setLooking(true)
    try {
      const d = await fetch(`/api/staff/student-affairs/lookup?seat=${encodeURIComponent(seat)}`).then(r => r.json())
      if (d.found) { setForm(f => ({ ...f, studentName: d.student.nameAr ?? f.studentName, gradeAr: d.student.gradeAr ?? f.gradeAr })); notify('تم العثور على الطالب وتعبئة بياناته') }
      else notify('لم يتم العثور على رقم الجلوس — أكمل البيانات يدويًا', 'error')
    } finally { setLooking(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.seatNumber.trim() || !form.studentName.trim() || !form.description.trim()) { notify('رقم الجلوس واسم الطالب والوصف حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/staff/student-affairs/conduct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر إضافة الملاحظة', 'error'); return }
      notify('تم تسجيل الملاحظة بنجاح')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  async function remove(n: ConductRow) {
    if (!confirm(`حذف ملاحظة ${n.studentName}؟`)) return
    const res = await fetch(`/api/staff/student-affairs/conduct/${n.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تم حذف الملاحظة'); load() } else notify('تعذّر الحذف', 'error')
  }

  const filtered = filter === 'all' ? notes : notes.filter(n => n.type === filter)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 400px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس"
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="all">كل الأنواع</option>
            <option value="positive">إيجابية فقط</option>
            <option value="negative">سلبية فقط</option>
            <option value="note">ملاحظات عامة</option>
          </select>
          <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ ملاحظة جديدة</button>
        </div>

        {loading ? <Loading /> : filtered.length === 0 ? (
          <Empty icon="📋" text={search || filter !== 'all' ? 'لا توجد ملاحظات مطابقة' : 'لا توجد ملاحظات سلوك بعد'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(n => {
              const m = CONDUCT_META[n.type] ?? CONDUCT_META.note
              return (
                <div key={n.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '5px 12px', borderRadius: '999px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.icon} {m.label}</span>
                  <div style={{ flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{n.studentName} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>· {n.gradeAr} · رقم {n.seatNumber}</span></div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: '4px' }}>{n.description}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '6px' }}>{n.date}{n.recordedBy ? ` · سجّلها ${n.recordedBy}` : ''}</div>
                  </div>
                  <button onClick={() => remove(n)} className="btn-danger btn-sm">حذف</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>ملاحظة سلوك جديدة</div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="الصف"><input className="form-input" value={form.gradeAr} onChange={e => set('gradeAr', e.target.value)} /></Field>
                <Field label="التاريخ"><input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
              </div>
              <Field label="نوع الملاحظة *">
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['positive', 'negative', 'note'] as const).map(t => {
                    const m = CONDUCT_META[t]; const active = form.type === t
                    return <button key={t} type="button" onClick={() => set('type', t)} style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', border: `1.5px solid ${m.color}`, background: active ? m.color : 'white', color: active ? 'white' : m.color }}>{m.icon} {m.label}</button>
                  })}
                </div>
              </Field>
              <Field label="الوصف *"><textarea className="form-input" rows={4} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="اكتب تفاصيل الملاحظة..." /></Field>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? <><span className="spinner" /> جارٍ الحفظ...</> : 'تسجيل الملاحظة'}</button>
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
// Excel Import
// ============================================================
const STUDENT_COLS = ['seatNumber','nameAr','nameEn','gradeAr','guardianName','guardianPhone','address','enrollDate']
const STUDENT_HEADERS: Record<string,string> = { seatNumber:'رقم الجلوس*', nameAr:'الاسم عربي*', nameEn:'الاسم إنجليزي', gradeAr:'الصف*', guardianName:'ولي الأمر', guardianPhone:'هاتف ولي الأمر', address:'العنوان', enrollDate:'تاريخ الالتحاق' }

function ImportTab({ notify }: { notify: Notify }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<Record<string,string>[]>([])
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)

  function parseFile(file: File) {
    setResult(null)
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (rows.length < 2) { notify('الملف فارغ أو لا يحتوي على بيانات', 'error'); return }
      const parsed: Record<string,string>[] = []
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] as string[]
        if (!r[0] && !r[1]) continue
        const obj: Record<string,string> = {}
        STUDENT_COLS.forEach((col, idx) => { obj[col] = String(r[idx] ?? '').trim() })
        parsed.push(obj)
      }
      setPreview(parsed)
      setFileName(file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  async function doImport() {
    if (!preview.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/staff/student-affairs/students/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) })
      const d = await res.json()
      setResult(d)
      if (res.ok) notify(`تم: ${d.created} جديد، ${d.updated} محدَّث`)
      else notify(d.error || 'فشل الاستيراد', 'error')
    } finally { setSaving(false) }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([STUDENT_COLS.map(c => STUDENT_HEADERS[c]), ['1001','أحمد محمد','Ahmed Mohamed','الصف الأول','محمد علي','01012345678','الإسكندرية','']])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'الطلاب')
    XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب.xlsx')
  }

  return (
    <div>
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>📥 استيراد طلاب من Excel</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '3px' }}>ارفع ملف Excel لإضافة أو تحديث ملفات الطلاب دفعةً واحدة</div>
          </div>
          <button onClick={downloadTemplate} className="btn-outline btn-sm">⬇️ تحميل النموذج</button>
        </div>
        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f) }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#0a5c36' : '#e2e8f0'}`, borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f0fdf4' : '#fafafa', transition: 'all 0.15s' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f) }} />
          <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>📊</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{fileName || 'اسحب ملف Excel هنا أو اضغط للاختيار'}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>.xlsx · .xls · .csv</div>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>معاينة — {preview.length} طالب</div>
            <button onClick={doImport} disabled={saving} className="btn-primary">
              {saving ? <><span className="spinner" /> جارٍ الاستيراد...</> : `✅ استيراد ${preview.length} طالب`}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead><tr style={{ background: '#f1f5f9' }}>
                {['رقم الجلوس','الاسم عربي','الصف','هاتف ولي الأمر'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'start', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{preview.slice(0,10).map((r,i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.seatNumber}</td>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{r.nameAr}</td>
                  <td style={{ padding: '7px 12px' }}>{r.gradeAr}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.guardianPhone}</td>
                </tr>
              ))}</tbody>
            </table>
            {preview.length > 10 && <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.78rem' }}>+{preview.length - 10} صفوف أخرى</div>}
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: '18px 20px', borderColor: result.errors.length ? '#fca5a5' : '#86efac' }}>
          <div style={{ fontWeight: 800, marginBottom: '8px' }}>نتيجة الاستيراد</div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: result.errors.length ? '12px' : 0 }}>
            <span style={{ color: '#15803d' }}>✅ جديد: <strong>{result.created}</strong></span>
            <span style={{ color: '#2563eb' }}>🔄 محدَّث: <strong>{result.updated}</strong></span>
            {result.errors.length > 0 && <span style={{ color: '#dc2626' }}>❌ أخطاء: <strong>{result.errors.length}</strong></span>}
          </div>
          {result.errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#dc2626' }}>• {e}</div>)}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Certificates
// ============================================================
function CertificatesTab({ notify }: { notify: Notify }) {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState<{ seatNumber: string; nameAr: string; gradeAr: string; status: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!search.trim()) { setStudents([]); return }
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`/api/staff/student-affairs/students?search=${encodeURIComponent(search)}`)
        .then(r => r.json()).then(d => setStudents(d.files ?? [])).finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div>
      <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>📄 شهادات القيد والقبول</div>
        <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '16px' }}>ابحث عن طالب لطباعة شهادة قيده — ستُفتح في نافذة جديدة جاهزة للطباعة كـ PDF</div>
        <input className="form-input" placeholder="🔍 ابحث باسم الطالب أو رقم الجلوس..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <Loading />}
      {!loading && search && students.length === 0 && <Empty icon="🔍" text="لا توجد نتائج — جرب اسمًا مختلفًا" />}
      {students.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {students.map(s => (
            <div key={s.seatNumber} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.nameAr}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>رقم الجلوس: {s.seatNumber} · {s.gradeAr}</div>
              </div>
              <button
                onClick={() => window.open(`/staff/student-affairs/certificate/${s.seatNumber}`, '_blank')}
                className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                🖨️ طباعة شهادة
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Page shell
// ============================================================
export default function StudentAffairsPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const notify: Notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  return (
    <StaffShell title="شؤون الطلبة" icon="🎓" tabs={TABS} active={tab} onTabChange={k => setTab(k as TabKey)}>
      {toast && <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}</div>}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'files' && <FilesTab notify={notify} />}
      {tab === 'attendance' && <AttendanceTab notify={notify} />}
      {tab === 'conduct' && <ConductTab notify={notify} />}
      {tab === 'import' && <ImportTab notify={notify} />}
      {tab === 'certificates' && <CertificatesTab notify={notify} />}
    </StaffShell>
  )
}
