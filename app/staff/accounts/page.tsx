'use client'
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import * as XLSX from 'xlsx'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'fees' | 'payments' | 'expenses' | 'import' | 'overdue'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'fees', label: 'الرسوم الدراسية' },
  { key: 'payments', label: 'المدفوعات الإلكترونية' },
  { key: 'expenses', label: 'المصروفات' },
  { key: 'import', label: '📥 استيراد / تعيين' },
  { key: 'overdue', label: '⚠️ المتأخرون' },
]

const EXPENSE_CATEGORIES = ['رواتب', 'مرافق', 'صيانة', 'مستلزمات', 'مواصلات', 'أخرى']

const FEE_STATUS_META: Record<'paid' | 'unpaid', { label: string; color: string; bg: string }> = {
  paid: { label: 'مدفوع', color: '#15803d', bg: '#f0fdf4' },
  unpaid: { label: 'غير مدفوع', color: '#dc2626', bg: '#fef2f2' },
}
const PAYMENT_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  success: { label: 'ناجحة', color: '#15803d', bg: '#f0fdf4' },
  pending: { label: 'قيد الانتظار', color: '#d97706', bg: '#fffbeb' },
  failed: { label: 'فاشلة', color: '#dc2626', bg: '#fef2f2' },
}

function fmtMoney(n: number) { return `${n.toLocaleString()} ج.م` }
function todayStr() { return new Date().toISOString().slice(0, 10) }

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
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: color ?? '#0f172a', lineHeight: 1.1 }}>{value}</div>
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
interface AccountsOverview {
  totalExpected: number; totalCollected: number; totalOutstanding: number
  feeCount: number; paidCount: number; unpaidCount: number; collectionRate: number
  totalExpenses: number; netBalance: number
  gradeBreakdown: { gradeAr: string; expected: number; collected: number; count: number }[]
  expenseBreakdown: { category: string; amount: number }[]
  recentPayments: { id: number; studentName: string; gradeAr: string | null; amount: number; paidAt: string | null }[]
  recentExpenses: { id: number; date: string; category: string; description: string; amount: number; paidTo: string | null }[]
}

function OverviewTab() {
  const [data, setData] = useState<AccountsOverview | null>(null)
  useEffect(() => { fetch('/api/staff/accounts/overview').then(r => r.json()).then(setData) }, [])
  if (!data) return <Loading />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <StatCard icon="💰" label="إجمالي الرسوم المتوقعة" value={fmtMoney(data.totalExpected)} />
        <StatCard icon="✅" label="تم تحصيله" value={fmtMoney(data.totalCollected)} color="#15803d" sub={`${data.collectionRate}%`} />
        <StatCard icon="⏳" label="متبقٍ (غير محصَّل)" value={fmtMoney(data.totalOutstanding)} color="#d97706" />
        <StatCard icon="📋" label="عدد سجلات الرسوم" value={data.feeCount} sub={`${data.paidCount} مدفوع · ${data.unpaidCount} غير مدفوع`} color="#2563eb" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <StatCard icon="🧾" label="إجمالي المصروفات" value={fmtMoney(data.totalExpenses)} color="#dc2626" />
        <StatCard icon="⚖️" label="الرصيد الصافي (تحصيل − مصروفات)" value={fmtMoney(data.netBalance)} color={data.netBalance >= 0 ? '#15803d' : '#dc2626'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🏫 التحصيل حسب الصف</div>
          {data.gradeBreakdown.length === 0 ? <Empty icon="💰" text="لا توجد سجلات رسوم بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.gradeBreakdown.map(g => {
                const pct = g.expected > 0 ? Math.round((g.collected / g.expected) * 100) : 0
                return (
                  <div key={g.gradeAr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#374151' }}>{g.gradeAr} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({g.count})</span></span>
                      <span style={{ color: '#64748b' }}>{fmtMoney(g.collected)} / {fmtMoney(g.expected)}</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#15803d' : pct >= 50 ? '#0a5c36' : '#d97706', borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🧾 المصروفات حسب الفئة</div>
          {data.expenseBreakdown.length === 0 ? <Empty icon="🧾" text="لا توجد مصروفات مسجَّلة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.expenseBreakdown.map(c => (
                <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.88rem' }}>{c.category}</span>
                  <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.88rem' }}>{fmtMoney(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>💳 آخر المدفوعات الإلكترونية</div>
          {data.recentPayments.length === 0 ? <Empty icon="💳" text="لا توجد مدفوعات إلكترونية ناجحة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recentPayments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>{p.studentName}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{p.gradeAr ?? ''}{p.paidAt ? ` · ${new Date(p.paidAt).toLocaleDateString('ar-EG')}` : ''}</div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.86rem' }}>{fmtMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🧾 آخر المصروفات</div>
          {data.recentExpenses.length === 0 ? <Empty icon="🧾" text="لا توجد مصروفات مسجَّلة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recentExpenses.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>{e.description}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{e.category} · {e.date}{e.paidTo ? ` · ${e.paidTo}` : ''}</div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.86rem' }}>{fmtMoney(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Fees (FeeRecord — same data parents/admin see)
// ============================================================
interface FeeRow {
  id: number; studentName: string; seatNumber: string | null; gradeAr: string; amount: number
  isPaid: boolean; paidAt: string | null; notes: string | null; academicYear: string; createdAt: string; paymentCount: number
}
type FeeForm = { studentName: string; seatNumber: string; gradeAr: string; amount: string; academicYear: string; notes: string }
const EMPTY_FEE_FORM: FeeForm = { studentName: '', seatNumber: '', gradeAr: '', amount: '', academicYear: '', notes: '' }

function FeesTab({ notify }: { notify: Notify }) {
  const [fees, setFees] = useState<FeeRow[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FeeForm>(EMPTY_FEE_FORM)
  const [saving, setSaving] = useState(false)
  const [looking, setLooking] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (status) qs.set('status', status)
    fetch(`/api/staff/accounts?${qs.toString()}`).then(r => r.json()).then(d => { setFees(d.fees ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search, status])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() { setForm(EMPTY_FEE_FORM); setShowForm(true) }
  function closeForm() { setShowForm(false); setForm(EMPTY_FEE_FORM) }
  function set<K extends keyof FeeForm>(key: K, value: FeeForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function lookupSeat() {
    const seat = form.seatNumber.trim()
    if (!seat) { notify('اكتب رقم الجلوس أولاً', 'error'); return }
    setLooking(true)
    try {
      const d = await fetch(`/api/staff/accounts/lookup?seat=${encodeURIComponent(seat)}`).then(r => r.json())
      if (d.found) {
        setForm(f => ({ ...f, studentName: d.student.nameAr ?? f.studentName, gradeAr: d.student.gradeAr ?? f.gradeAr }))
        notify(d.existingFeeCount > 0 ? `تنبيه: يوجد ${d.existingFeeCount} سجل رسوم مسبق لهذا الطالب` : 'تم العثور على الطالب وتعبئة بياناته', d.existingFeeCount > 0 ? 'error' : 'success')
      } else notify('لم يتم العثور على رقم الجلوس — أكمل البيانات يدويًا', 'error')
    } finally { setLooking(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.studentName.trim() || !form.gradeAr.trim() || !form.amount || !form.academicYear.trim()) { notify('اسم الطالب والصف والمبلغ والعام الدراسي حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/staff/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر إنشاء السجل', 'error'); return }
      notify('تمت إضافة سجل الرسوم بنجاح')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  async function togglePaid(f: FeeRow) {
    const res = await fetch(`/api/staff/accounts/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPaid: !f.isPaid }) })
    if (res.ok) { notify(f.isPaid ? 'تم تعليم السجل كغير مدفوع' : 'تم تعليم السجل كمدفوع'); load() }
    else notify('تعذّر تحديث الحالة', 'error')
  }

  async function remove(f: FeeRow) {
    if (!confirm(`حذف سجل رسوم «${f.studentName}» بقيمة ${f.amount.toLocaleString()} ج.م؟`)) return
    const res = await fetch(`/api/staff/accounts/${f.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تم حذف السجل'); load() } else notify('تعذّر الحذف', 'error')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 400px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس"
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <select value={status} onChange={e => setStatus(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="">كل الحالات</option>
            <option value="paid">مدفوع</option>
            <option value="unpaid">غير مدفوع</option>
          </select>
          <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ سجل رسوم جديد</button>
        </div>

        {loading ? <Loading /> : fees.length === 0 ? (
          <Empty icon="💰" text={search || status ? 'لا توجد سجلات مطابقة' : 'لا توجد سجلات رسوم بعد — أضف أول سجل'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fees.map(f => {
              const m = f.isPaid ? FEE_STATUS_META.paid : FEE_STATUS_META.unpaid
              return (
                <div key={f.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{f.studentName} {f.seatNumber ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.78rem' }}>· #{f.seatNumber}</span> : null}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                      {f.gradeAr} · {f.academicYear}{f.paymentCount > 0 ? ` · 💳 ${f.paymentCount} عملية دفع إلكتروني` : ''}{f.notes ? ` · 📝 ${f.notes}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{f.amount.toLocaleString()} ج.م</div>
                    {f.paidAt ? <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>دُفع {new Date(f.paidAt).toLocaleDateString('ar-EG')}</div> : null}
                  </div>
                  <button onClick={() => togglePaid(f)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 14px', borderRadius: '999px', background: m.bg, color: m.color, border: 'none', cursor: 'pointer' }}>{m.label} ↻</button>
                  <button onClick={() => remove(f)} className="btn-danger btn-sm">حذف</button>
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
              <div style={{ fontWeight: 800, color: '#0f172a' }}>سجل رسوم جديد</div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={submit}>
              <Field label="رقم الجلوس">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="form-input" value={form.seatNumber} onChange={e => set('seatNumber', e.target.value)} placeholder="مثال: 1023" />
                  <button type="button" onClick={lookupSeat} disabled={looking} className="btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>{looking ? '...' : '🔍 بحث'}</button>
                </div>
              </Field>
              <Field label="اسم الطالب *"><input className="form-input" value={form.studentName} onChange={e => set('studentName', e.target.value)} /></Field>
              <Field label="الصف *"><input className="form-input" value={form.gradeAr} onChange={e => set('gradeAr', e.target.value)} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="المبلغ (ج.م) *"><input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} /></Field>
                <Field label="العام الدراسي *"><input className="form-input" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} placeholder="مثال: 2025-2026" /></Field>
              </div>
              <Field label="ملاحظات"><textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? <><span className="spinner" /> جارٍ الحفظ...</> : 'إضافة السجل'}</button>
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
// Online payments (Payment — read-only audit log)
// ============================================================
interface PaymentRow {
  id: number; studentName: string | null; gradeAr: string | null; academicYear: string | null; seatNumber: string
  amount: number; currency: string; status: string; specialReference: string; paymobTransactionId: string | null
  paidAt: string | null; createdAt: string
}

function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (status) qs.set('status', status)
    fetch(`/api/staff/accounts/payments?${qs.toString()}`).then(r => r.json()).then(d => { setPayments(d.payments ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search, status])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس أو رقم العملية"
          style={{ flex: 1, minWidth: '220px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
        <select value={status} onChange={e => setStatus(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
          <option value="">كل الحالات</option>
          <option value="success">ناجحة</option>
          <option value="pending">قيد الانتظار</option>
          <option value="failed">فاشلة</option>
        </select>
      </div>
      <div style={{ padding: '10px 16px', background: '#eff6ff', borderRadius: '10px', color: '#2563eb', fontSize: '0.8rem', marginBottom: '14px' }}>
        ℹ️ سجل للقراءة فقط يعرض عمليات الدفع الإلكتروني عبر بوابة الدفع — للمراجعة والتسوية المالية فقط.
      </div>
      {loading ? <Loading /> : payments.length === 0 ? (
        <Empty icon="💳" text={search || status ? 'لا توجد عمليات مطابقة' : 'لا توجد عمليات دفع إلكتروني بعد'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {payments.map(p => {
            const m = PAYMENT_STATUS_META[p.status] ?? PAYMENT_STATUS_META.pending
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: '12px', padding: '13px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{p.studentName ?? `مقعد #${p.seatNumber}`} {p.gradeAr ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.78rem' }}>· {p.gradeAr}</span> : null}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '2px', fontFamily: 'monospace' }}>{p.specialReference}{p.paymobTransactionId ? ` · Paymob #${p.paymobTransactionId}` : ''}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{p.amount.toLocaleString()} {p.currency}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.paidAt ? new Date(p.paidAt).toLocaleString('ar-EG') : new Date(p.createdAt).toLocaleString('ar-EG')}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Expenses (own ledger)
// ============================================================
interface ExpenseRow { id: number; date: string; category: string; description: string; amount: number; paidTo: string | null; notes: string | null; recordedBy: string | null }
type ExpenseForm = { date: string; category: string; description: string; amount: string; paidTo: string; notes: string }
function emptyExpenseForm(): ExpenseForm { return { date: todayStr(), category: EXPENSE_CATEGORIES[0], description: '', amount: '', paidTo: '', notes: '' } }
function expenseToForm(x: ExpenseRow): ExpenseForm { return { date: x.date, category: x.category, description: x.description, amount: String(x.amount), paidTo: x.paidTo ?? '', notes: x.notes ?? '' } }

function ExpensesTab({ notify }: { notify: Notify }) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [categories, setCategories] = useState<string[]>(EXPENSE_CATEGORIES)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ExpenseRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ExpenseForm>(emptyExpenseForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (category) qs.set('category', category)
    fetch(`/api/staff/accounts/expenses?${qs.toString()}`).then(r => r.json()).then(d => { setExpenses(d.expenses ?? []); if (d.categories) setCategories(d.categories); setLoading(false) }).catch(() => setLoading(false))
  }, [search, category])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() { setEditing(null); setForm(emptyExpenseForm()); setShowForm(true) }
  function openEdit(x: ExpenseRow) { setEditing(x); setForm(expenseToForm(x)); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null); setForm(emptyExpenseForm()) }
  function set<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date.trim() || !form.category.trim() || !form.description.trim() || !form.amount) { notify('التاريخ والفئة والوصف والمبلغ حقول مطلوبة', 'error'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/staff/accounts/expenses/${editing.id}` : '/api/staff/accounts/expenses'
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'حدث خطأ غير متوقع', 'error'); return }
      notify(editing ? 'تم حفظ تعديلات المصروف' : 'تمت إضافة المصروف بنجاح')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  async function remove(x: ExpenseRow) {
    if (!confirm(`حذف مصروف «${x.description}» بقيمة ${x.amount.toLocaleString()} ج.م؟`)) return
    const res = await fetch(`/api/staff/accounts/expenses/${x.id}`, { method: 'DELETE' })
    if (res.ok) { notify('تم حذف المصروف'); if (editing?.id === x.id) closeForm(); load() } else notify('تعذّر الحذف', 'error')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0,1fr) 400px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالوصف أو الجهة المستلمة"
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <select value={category} onChange={e => setCategory(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="">كل الفئات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={openCreate} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ مصروف جديد</button>
        </div>

        {loading ? <Loading /> : expenses.length === 0 ? (
          <Empty icon="🧾" text={search || category ? 'لا توجد مصروفات مطابقة' : 'لا توجد مصروفات مسجَّلة بعد — أضف أول مصروف'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenses.map(x => (
              <div key={x.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: editing?.id === x.id ? '2px solid #0a5c36' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{x.description}</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                    {x.category} · 📅 {x.date}{x.paidTo ? ` · 🏢 ${x.paidTo}` : ''}{x.recordedBy ? ` · 👤 سجّله ${x.recordedBy}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#dc2626' }}>{x.amount.toLocaleString()} ج.م</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(x)} className="btn-outline btn-sm">تعديل</button>
                  <button onClick={() => remove(x)} className="btn-danger btn-sm">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{editing ? 'تعديل مصروف' : 'مصروف جديد'}</div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="التاريخ *"><input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
                <Field label="الفئة *">
                  <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="الوصف *"><input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="مثال: فاتورة كهرباء شهر مايو" /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="المبلغ (ج.م) *"><input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} /></Field>
                <Field label="صُرف إلى"><input className="form-input" value={form.paidTo} onChange={e => set('paidTo', e.target.value)} placeholder="اسم المورّد / الجهة" /></Field>
              </div>
              <Field label="ملاحظات"><textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? <><span className="spinner" /> جارٍ الحفظ...</> : editing ? 'حفظ التعديلات' : 'إضافة المصروف'}</button>
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
// Excel Import / Bulk Fee Assign
// ============================================================
const FEE_COLS = ['studentName','seatNumber','gradeAr','amount','academicYear','notes']
const FEE_HEADERS: Record<string,string> = { studentName:'اسم الطالب*', seatNumber:'رقم الجلوس', gradeAr:'الصف*', amount:'المبلغ*', academicYear:'العام الدراسي*', notes:'ملاحظات' }

function AccountsImportTab({ notify }: { notify: Notify }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'import' | 'assign'>('assign')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<Record<string,string>[]>([])
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ created?: number; updated?: number; skipped?: number; errors?: string[] } | null>(null)
  // bulk assign form
  const [assignAmount, setAssignAmount] = useState('')
  const [assignYear, setAssignYear] = useState('')
  const [assignNotes, setAssignNotes] = useState('')

  function parseFile(file: File) {
    setResult(null)
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (rows.length < 2) { notify('الملف فارغ', 'error'); return }
      const parsed: Record<string,string>[] = []
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] as string[]
        if (!r[0] && !r[2]) continue
        const obj: Record<string,string> = {}
        FEE_COLS.forEach((col, idx) => { obj[col] = String(r[idx] ?? '').trim() })
        parsed.push(obj)
      }
      setPreview(parsed); setFileName(file.name); setMode('import')
    }
    reader.readAsArrayBuffer(file)
  }

  async function doImport() {
    if (!preview.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/staff/accounts/fees/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'import', fees: preview }) })
      const d = await res.json()
      setResult(d)
      if (res.ok) notify(`تم: ${d.created ?? 0} جديد`)
      else notify(d.error || 'فشل الاستيراد', 'error')
    } finally { setSaving(false) }
  }

  async function doAssign() {
    if (!assignAmount || !assignYear) { notify('المبلغ والعام الدراسي مطلوبان', 'error'); return }
    if (!confirm(`هل تريد تعيين رسوم ${Number(assignAmount).toLocaleString()} ج.م للعام ${assignYear} لجميع الطلاب النشطين؟`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/staff/accounts/fees/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'assign', amount: Number(assignAmount), academicYear: assignYear, notes: assignNotes || undefined }) })
      const d = await res.json()
      setResult(d)
      if (res.ok) notify(`تم تعيين الرسوم لـ ${d.created} طالب (تخطي ${d.skipped ?? 0} مكرر)`)
      else notify(d.error || 'فشل التعيين', 'error')
    } finally { setSaving(false) }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([FEE_COLS.map(c => FEE_HEADERS[c]), ['أحمد محمد','1001','الصف الأول','5000','2025-2026','']])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'الرسوم')
    XLSX.writeFile(wb, 'نموذج_استيراد_الرسوم.xlsx')
  }

  return (
    <div>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        {([['assign','⚡ تعيين للكل'],['import','📥 استيراد Excel']] as [typeof mode, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{ padding: '9px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', cursor: 'pointer', background: mode === k ? '#0a5c36' : 'white', color: mode === k ? 'white' : '#374151', border: mode === k ? 'none' : '1px solid #e2e8f0' }}>{label}</button>
        ))}
      </div>

      {mode === 'assign' && (
        <div className="card" style={{ padding: '22px', maxWidth: '540px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>⚡ تعيين رسوم لجميع الطلاب النشطين</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '18px' }}>يُنشئ سجل رسوم واحد لكل طالب نشط — يتخطى الطلاب الذين لديهم سجل للعام نفسه</div>
          <Field label="المبلغ (ج.م) *"><input className="form-input" type="number" min="1" value={assignAmount} onChange={e => setAssignAmount(e.target.value)} placeholder="مثال: 5000" /></Field>
          <Field label="العام الدراسي *"><input className="form-input" value={assignYear} onChange={e => setAssignYear(e.target.value)} placeholder="مثال: 2025-2026" /></Field>
          <Field label="ملاحظات"><input className="form-input" value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="اختياري" /></Field>
          <button onClick={doAssign} disabled={saving} className="btn-primary">
            {saving ? <><span className="spinner" /> جارٍ التعيين...</> : '✅ تعيين الرسوم الآن'}
          </button>
        </div>
      )}

      {mode === 'import' && (
        <>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>📥 استيراد رسوم من Excel</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '3px' }}>كل صف = سجل رسوم جديد</div>
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
                <div style={{ fontWeight: 700 }}>معاينة — {preview.length} سجل</div>
                <button onClick={doImport} disabled={saving} className="btn-primary">
                  {saving ? <><span className="spinner" /> جارٍ الاستيراد...</> : `✅ استيراد ${preview.length} سجل`}
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}>
                    {['اسم الطالب','الصف','المبلغ','العام الدراسي'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'start', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{preview.slice(0, 10).map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{r.studentName}</td>
                      <td style={{ padding: '7px 12px' }}>{r.gradeAr}</td>
                      <td style={{ padding: '7px 12px', color: '#15803d', fontWeight: 700 }}>{r.amount}</td>
                      <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.academicYear}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {preview.length > 10 && <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.78rem' }}>+{preview.length - 10} صفوف أخرى</div>}
              </div>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="card" style={{ padding: '18px 20px', borderColor: (result.errors?.length ?? 0) > 0 ? '#fca5a5' : '#86efac', marginTop: '14px' }}>
          <div style={{ fontWeight: 800, marginBottom: '8px' }}>النتيجة</div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {result.created !== undefined && <span style={{ color: '#15803d' }}>✅ أُنشئ: <strong>{result.created}</strong></span>}
            {result.skipped !== undefined && <span style={{ color: '#2563eb' }}>⏭️ تخطّى: <strong>{result.skipped}</strong></span>}
            {(result.errors?.length ?? 0) > 0 && <span style={{ color: '#dc2626' }}>❌ أخطاء: <strong>{result.errors!.length}</strong></span>}
          </div>
          {result.errors?.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '6px' }}>• {e}</div>)}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Overdue Fees with WhatsApp Reminder
// ============================================================
interface OverdueRow {
  id: number; studentName: string; seatNumber: string | null; gradeAr: string; amount: number; academicYear: string; phone: string | null
}

function OverdueTab({ notify }: { notify: Notify }) {
  const [overdue, setOverdue] = useState<OverdueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/staff/accounts/fees/overdue').then(r => r.json()).then(d => { setOverdue(d.overdue ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function sendReminder(row: OverdueRow) {
    if (!row.phone) { notify('لا يوجد رقم هاتف لهذا الطالب', 'error'); return }
    setSending(row.id)
    try {
      const res = await fetch('/api/staff/accounts/fees/remind', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: row.phone, studentName: row.studentName, amount: row.amount, academicYear: row.academicYear }) })
      const d = await res.json()
      if (res.ok && d.sent) notify(`تم إرسال تذكير WhatsApp إلى ولي أمر ${row.studentName}`)
      else notify('فشل إرسال الرسالة — تأكد من إعداد UltraMsg', 'error')
    } finally { setSending(null) }
  }

  async function sendAll() {
    const withPhone = filtered.filter(r => r.phone)
    if (!withPhone.length) { notify('لا يوجد طلاب متأخرون لديهم أرقام هاتف', 'error'); return }
    if (!confirm(`إرسال تذكير WhatsApp لـ ${withPhone.length} ولي أمر؟`)) return
    let sent = 0
    for (const r of withPhone) {
      await fetch('/api/staff/accounts/fees/remind', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: r.phone, studentName: r.studentName, amount: r.amount, academicYear: r.academicYear }) })
      sent++
    }
    notify(`تم إرسال ${sent} تذكير`)
  }

  const filtered = overdue.filter(r => !search || r.studentName.includes(search) || (r.seatNumber ?? '').includes(search) || r.gradeAr.includes(search))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الصف أو رقم الجلوس"
          style={{ flex: 1, minWidth: '220px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
        <div style={{ color: '#64748b', fontSize: '0.82rem' }}>⚠️ {filtered.length} طالب متأخر</div>
        {filtered.some(r => r.phone) && (
          <button onClick={sendAll} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>📲 إرسال الكل</button>
        )}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon="✅" text="لا يوجد طلاب متأخرون — ممتاز!" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{r.studentName} {r.seatNumber ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.78rem' }}>#{r.seatNumber}</span> : null}</div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>{r.gradeAr} · {r.academicYear} · {r.phone ? `📞 ${r.phone}` : <span style={{ color: '#f59e0b' }}>⚠️ بلا رقم هاتف</span>}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#dc2626' }}>{r.amount.toLocaleString()} ج.م</div>
              <button onClick={() => sendReminder(r)} disabled={!r.phone || sending === r.id} className="btn-outline btn-sm" style={{ whiteSpace: 'nowrap', color: r.phone ? '#0a5c36' : '#94a3b8' }}>
                {sending === r.id ? '...' : '📲 تذكير'}
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
export default function AccountsPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const notify: Notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  return (
    <StaffShell title="حسابات الماليات" icon="💰" tabs={TABS} active={tab} onTabChange={k => setTab(k as TabKey)}>
      {toast && <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}</div>}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'fees' && <FeesTab notify={notify} />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'expenses' && <ExpensesTab notify={notify} />}
      {tab === 'import' && <AccountsImportTab notify={notify} />}
      {tab === 'overdue' && <OverdueTab notify={notify} />}
    </StaffShell>
  )
}
