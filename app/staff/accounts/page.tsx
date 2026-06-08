'use client'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'fees' | 'payments' | 'expenses'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'fees', label: 'الرسوم الدراسية' },
  { key: 'payments', label: 'المدفوعات الإلكترونية' },
  { key: 'expenses', label: 'المصروفات' },
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
    </StaffShell>
  )
}
