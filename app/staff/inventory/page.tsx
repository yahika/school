'use client'
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import * as XLSX from 'xlsx'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'items' | 'movements' | 'import' | 'distribute'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'items', label: 'الأصناف' },
  { key: 'movements', label: 'حركة المخزون' },
  { key: 'import', label: '📥 استيراد Excel' },
  { key: 'distribute', label: '📋 توزيع على الصفوف' },
]

// local copy matching the server export in app/api/staff/inventory/route.ts
const INVENTORY_CATEGORIES = ['كتب', 'يونيفورم', 'قرطاسية', 'أخرى']

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'كتب': { icon: '📚', color: '#2563eb' },
  'يونيفورم': { icon: '👔', color: '#7c3aed' },
  'قرطاسية': { icon: '✏️', color: '#d97706' },
  'أخرى': { icon: '📦', color: '#64748b' },
}
function categoryMeta(c: string) { return CATEGORY_META[c] ?? CATEGORY_META['أخرى'] }

function fmtMoney(n: number) { return `${n.toLocaleString()} ج.م` }
function todayStr() { return new Date().toISOString().slice(0, 10) }

// ---------- shared bits (mirrors other staff portals) ----------
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
interface CategoryBreakdown { category: string; itemCount: number; totalQuantity: number }
interface LowStockItem { id: number; nameAr: string; category: string; quantity: number; unit: string; minThreshold: number }
interface RecentMovement { id: number; itemName: string; unit: string; type: string; quantity: number; date: string; reason: string | null }
interface InvOverview {
  totalItems: number; totalQuantity: number; lowStockCount: number; estimatedValue: number
  categoryBreakdown: CategoryBreakdown[]; lowStockItems: LowStockItem[]; recentMovements: RecentMovement[]
}

function OverviewTab({ onOpenItem }: { onOpenItem: (id: number) => void }) {
  const [data, setData] = useState<InvOverview | null>(null)
  useEffect(() => { fetch('/api/staff/inventory/overview').then(r => r.json()).then(setData) }, [])
  if (!data) return <Loading />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <StatCard icon="📦" label="إجمالي الأصناف" value={data.totalItems} color="#2563eb" />
        <StatCard icon="🔢" label="إجمالي الكميات بالمخزون" value={data.totalQuantity.toLocaleString()} color="#0a5c36" />
        <StatCard icon="⚠️" label="أصناف منخفضة المخزون" value={data.lowStockCount} color={data.lowStockCount > 0 ? '#dc2626' : '#15803d'} />
        <StatCard icon="💰" label="القيمة التقديرية للمخزون" value={fmtMoney(data.estimatedValue)} sub="حسب سعر الوحدة المسجَّل" color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🚨 تنبيهات انخفاض المخزون</div>
          {data.lowStockItems.length === 0 ? <Empty icon="🎉" text="لا توجد أصناف منخفضة المخزون حاليًا — كل شيء بخير" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.lowStockItems.map(i => {
                const cm = categoryMeta(i.category)
                return (
                  <button key={i.id} onClick={() => onOpenItem(i.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
                    <span style={{ textAlign: 'start' }}>
                      <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem' }}>{cm.icon} {i.nameAr}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{i.category} · الحد الأدنى {i.minThreshold} {i.unit}</div>
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, padding: '4px 12px', borderRadius: '999px', background: '#fee2e2', color: '#dc2626', whiteSpace: 'nowrap' }}>{i.quantity} {i.unit} متبقي</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📊 توزيع الأصناف حسب الفئة</div>
          {data.categoryBreakdown.length === 0 ? <Empty icon="📦" text="لا توجد أصناف مسجلة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {data.categoryBreakdown.map(c => {
                const cm = categoryMeta(c.category)
                const pct = data.totalQuantity > 0 ? Math.round((c.totalQuantity / data.totalQuantity) * 100) : 0
                return (
                  <div key={c.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#374151' }}>{cm.icon} {c.category}</span>
                      <span style={{ color: '#94a3b8' }}>{c.itemCount} صنف · {c.totalQuantity.toLocaleString()} وحدة</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cm.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🕓 آخر حركات المخزون</div>
          {data.recentMovements.length === 0 ? <Empty icon="🕓" text="لا توجد حركات مخزون مسجلة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.recentMovements.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.82rem', color: '#374151' }}>{m.type === 'in' ? '📥' : '📤'} {m.itemName}{m.reason ? <span style={{ color: '#94a3b8' }}> · {m.reason}</span> : null}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: m.type === 'in' ? '#15803d' : '#dc2626' }}>{m.type === 'in' ? '+' : '−'}{m.quantity} {m.unit}</span>
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
// Items (full CRUD)
// ============================================================
interface ItemRow {
  id: number; nameAr: string; nameEn: string | null; category: string; sku: string | null
  quantity: number; unit: string; minThreshold: number; unitPrice: number | null
  supplier: string | null; notes: string | null; createdAt: string
  isLow: boolean; movementCount: number
}

const emptyForm = {
  nameAr: '', nameEn: '', category: INVENTORY_CATEGORIES[0], sku: '',
  quantity: '', unit: 'قطعة', minThreshold: '', unitPrice: '', supplier: '', notes: '',
}

function ItemsTab({ notify, openItemId, onConsumeOpen, onRecordMovement }: {
  notify: Notify
  openItemId: number | null
  onConsumeOpen: () => void
  onRecordMovement: (itemId: number) => void
}) {
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [activeId, setActiveId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (category) qs.set('category', category)
    if (lowOnly) qs.set('lowStock', '1')
    fetch(`/api/staff/inventory?${qs.toString()}`).then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [search, category, lowOnly])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  // open an item's edit form when asked from elsewhere (e.g. low-stock alerts on the overview tab)
  useEffect(() => {
    if (openItemId != null) { setActiveId(openItemId); onConsumeOpen() }
  }, [openItemId, onConsumeOpen])

  const active = typeof activeId === 'number' ? items.find(i => i.id === activeId) ?? null : null

  // keep the form synced to whichever item is active (or reset for a new one)
  useEffect(() => {
    if (active) {
      setForm({
        nameAr: active.nameAr, nameEn: active.nameEn ?? '', category: active.category, sku: active.sku ?? '',
        quantity: String(active.quantity), unit: active.unit, minThreshold: String(active.minThreshold),
        unitPrice: active.unitPrice != null ? String(active.unitPrice) : '', supplier: active.supplier ?? '', notes: active.notes ?? '',
      })
    } else if (activeId === 'new') {
      setForm(emptyForm)
    }
  }, [activeId, active?.id])

  function startNew() { setActiveId('new'); setForm(emptyForm) }
  function closePanel() { setActiveId(null) }
  function update<K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) { setForm(f => ({ ...f, [key]: value })) }

  async function save() {
    if (!form.nameAr.trim()) { notify('اسم الصنف مطلوب', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim() || undefined, category: form.category,
        sku: form.sku.trim() || undefined, quantity: form.quantity === '' ? undefined : form.quantity,
        unit: form.unit.trim() || undefined, minThreshold: form.minThreshold === '' ? undefined : form.minThreshold,
        unitPrice: form.unitPrice === '' ? undefined : form.unitPrice,
        supplier: form.supplier.trim() || undefined, notes: form.notes.trim() || undefined,
      }
      const isNew = activeId === 'new'
      const res = await fetch(isNew ? '/api/staff/inventory' : `/api/staff/inventory/${activeId}`, {
        method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر الحفظ', 'error'); return }
      notify(isNew ? 'تمت إضافة الصنف بنجاح' : 'تم تحديث بيانات الصنف بنجاح')
      if (isNew && d.item?.id) setActiveId(d.item.id)
      load()
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!active) return
    if (!confirm(`هل تريد حذف الصنف «${active.nameAr}»؟ سيتم حذف سجل حركات مخزونه أيضًا — لا يمكن التراجع عن هذا الإجراء.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/staff/inventory/${active.id}`, { method: 'DELETE' })
      if (res.ok) { notify('تم حذف الصنف'); setActiveId(null); load() }
      else notify('تعذّر حذف الصنف', 'error')
    } finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: activeId !== null ? 'minmax(0,1fr) 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو الكود أو المورد"
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <select value={category} onChange={e => setCategory(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="">كل الفئات</option>
            {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} /> منخفض المخزون فقط
          </label>
          <button onClick={startNew} className="btn-primary btn-sm">+ صنف جديد</button>
        </div>

        {loading ? <Loading /> : items.length === 0 ? (
          <Empty icon="📦" text={search || category || lowOnly ? 'لا توجد أصناف مطابقة لبحثك' : 'لا توجد أصناف مسجلة بعد — أضف أول صنف للمخزون'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(i => {
              const cm = categoryMeta(i.category)
              return (
                <div key={i.id} onClick={() => setActiveId(i.id)}
                  style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', padding: '14px 18px', border: activeId === i.id ? '2px solid #0a5c36' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: cm.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>{cm.icon}</div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{i.nameAr}{i.nameEn ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.78rem' }}> ({i.nameEn})</span> : null}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>{i.category}{i.sku ? ` · كود ${i.sku}` : ''}{i.supplier ? ` · ${i.supplier}` : ''}{i.unitPrice != null ? ` · ${fmtMoney(i.unitPrice)} / ${i.unit}` : ''}</div>
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: i.isLow ? '#dc2626' : '#0f172a', whiteSpace: 'nowrap' }}>{i.quantity.toLocaleString()} {i.unit}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: i.isLow ? '#fef2f2' : '#f0fdf4', color: i.isLow ? '#dc2626' : '#15803d', whiteSpace: 'nowrap' }}>{i.isLow ? '⚠️ منخفض' : '✓ متوفر'}</span>
                  <button onClick={e => { e.stopPropagation(); onRecordMovement(i.id) }} className="btn-outline btn-sm">📦 حركة مخزون</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activeId !== null && (
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{activeId === 'new' ? '➕ صنف جديد' : '✏️ تعديل بيانات الصنف'}</div>
              <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>

            <Field label="اسم الصنف *">
              <input className="form-input" value={form.nameAr} onChange={e => update('nameAr', e.target.value)} placeholder="مثال: كتاب الرياضيات - الصف الأول" />
            </Field>
            <Field label="الاسم بالإنجليزية">
              <input className="form-input" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} dir="ltr" placeholder="اختياري" />
            </Field>
            <Field label="الفئة *">
              <select className="form-input" value={form.category} onChange={e => update('category', e.target.value)}>
                {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="الكود (SKU)">
              <input className="form-input" value={form.sku} onChange={e => update('sku', e.target.value)} dir="ltr" placeholder="اختياري" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="الكمية الحالية">
                <input className="form-input" type="number" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} placeholder="0" />
              </Field>
              <Field label="الوحدة">
                <input className="form-input" value={form.unit} onChange={e => update('unit', e.target.value)} placeholder="قطعة" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="حد التنبيه (الأدنى)">
                <input className="form-input" type="number" min="0" value={form.minThreshold} onChange={e => update('minThreshold', e.target.value)} placeholder="0" />
              </Field>
              <Field label="سعر الوحدة (ج.م)">
                <input className="form-input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => update('unitPrice', e.target.value)} placeholder="اختياري" />
              </Field>
            </div>
            <Field label="المورد">
              <input className="form-input" value={form.supplier} onChange={e => update('supplier', e.target.value)} placeholder="اختياري" />
            </Field>
            <Field label="ملاحظات">
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="اختياري" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>

            {activeId !== 'new' && active && (
              <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: '14px' }}>
                📜 {active.movementCount} حركة مخزون مسجلة لهذا الصنف · أُضيف بتاريخ {new Date(active.createdAt).toLocaleDateString('ar-EG')}
              </div>
            )}
            {activeId === 'new' && (
              <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: '14px' }}>
                💡 لتسجيل الكمية الحالية استخدم حقل «الكمية» هنا. الحركات اللاحقة (وارد/صادر) تُسجَّل من تبويب «حركة المخزون».
              </div>
            )}

            <button onClick={save} disabled={saving} className="btn-primary" style={{ width: '100%', marginBottom: activeId !== 'new' ? '10px' : 0 }}>
              {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : activeId === 'new' ? 'إضافة الصنف' : 'حفظ التعديلات'}
            </button>
            {activeId !== 'new' && (
              <button onClick={remove} disabled={deleting} className="btn-danger" style={{ width: '100%' }}>
                {deleting ? <><span className="spinner" /> جارٍ الحذف...</> : '🗑️ حذف الصنف'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Stock movements (in / out log + entry form)
// ============================================================
interface MovementRow { id: number; itemId: number; itemName: string; unit: string; category: string; type: string; quantity: number; date: string; reason: string | null; recordedBy: string | null; createdAt: string }
interface ItemOption { id: number; nameAr: string; category: string; quantity: number; unit: string }

function MovementsTab({ notify, presetItemId, onConsumePreset }: { notify: Notify; presetItemId: number | null; onConsumePreset: () => void }) {
  const [items, setItems] = useState<ItemOption[]>([])
  const [itemId, setItemId] = useState<number | ''>('')
  const [movements, setMovements] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(todayStr())
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  // self-fetch a lightweight item list for the picker (avoids staleness from the Items tab)
  const loadItems = useCallback(() => {
    fetch('/api/staff/inventory').then(r => r.json()).then(d => {
      const list = (d.items ?? []) as { id: number; nameAr: string; category: string; quantity: number; unit: string }[]
      setItems(list.map(i => ({ id: i.id, nameAr: i.nameAr, category: i.category, quantity: i.quantity, unit: i.unit })))
    })
  }, [])
  useEffect(() => { loadItems() }, [loadItems])

  // honor a preset coming from the Items tab's "📦 حركة مخزون" button — consumed once
  useEffect(() => {
    if (presetItemId != null) { setItemId(presetItemId); onConsumePreset() }
  }, [presetItemId, onConsumePreset])

  const active = items.find(i => i.id === itemId) ?? null

  const loadMovements = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (itemId !== '') qs.set('itemId', String(itemId))
    fetch(`/api/staff/inventory/movements?${qs.toString()}`).then(r => r.json()).then(d => { setMovements(d.movements ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [itemId])
  useEffect(() => { loadMovements() }, [loadMovements])

  function changeItem(value: string) { setItemId(value ? Number(value) : '') }

  async function record() {
    if (itemId === '') { notify('اختر صنفًا أولاً', 'error'); return }
    const q = Number(quantity)
    if (!Number.isFinite(q) || q <= 0) { notify('أدخل كمية صحيحة أكبر من صفر', 'error'); return }
    if (!date.trim()) { notify('التاريخ مطلوب', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/staff/inventory/movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, type, quantity: q, date, reason }),
      })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر تسجيل الحركة', 'error'); return }
      notify(type === 'in' ? '✅ تم تسجيل إضافة المخزون وتحديث الرصيد' : '✅ تم تسجيل صرف المخزون وتحديث الرصيد')
      setQuantity(''); setReason('')
      loadItems(); loadMovements()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <select value={itemId} onChange={e => changeItem(e.target.value)} className="form-input" style={{ width: 'auto', minWidth: '250px', padding: '9px 14px' }}>
            <option value="">كل الأصناف (آخر الحركات)</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.nameAr} · الرصيد {i.quantity} {i.unit}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : movements.length === 0 ? (
          <Empty icon="📭" text="لا توجد حركات مخزون مسجلة بعد" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {movements.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: (m.type === 'in' ? '#15803d' : '#dc2626') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>{m.type === 'in' ? '📥' : '📤'}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{m.itemName}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>
                      {m.date}{m.reason ? ` · ${m.reason}` : ''}{m.recordedBy ? ` · سجّلها ${m.recordedBy}` : ''}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: m.type === 'in' ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                  {m.type === 'in' ? '+' : '−'}{m.quantity} {m.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'sticky', top: '24px' }}>
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>📦 تسجيل حركة مخزون</div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '16px' }}>سجّل إضافة (وارد) أو صرف (صادر) — سيتم تحديث رصيد الصنف تلقائيًا فور الحفظ.</div>

          <Field label="الصنف *">
            <select className="form-input" value={itemId} onChange={e => changeItem(e.target.value)}>
              <option value="">اختر صنفًا...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.nameAr} · الرصيد {i.quantity} {i.unit}</option>)}
            </select>
          </Field>
          {active && (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.8rem', color: '#374151' }}>
              الرصيد الحالي: <strong>{active.quantity.toLocaleString()} {active.unit}</strong>
            </div>
          )}
          <Field label="نوع الحركة *">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setType('in')} className={type === 'in' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'} style={{ flex: 1 }}>📥 وارد (إضافة)</button>
              <button type="button" onClick={() => setType('out')} className={type === 'out' ? 'btn-danger btn-sm' : 'btn-outline btn-sm'} style={{ flex: 1 }}>📤 صادر (صرف)</button>
            </div>
          </Field>
          <Field label="الكمية *">
            <input className="form-input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
          </Field>
          <Field label="التاريخ *">
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="السبب / ملاحظات">
            <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: توريد جديد، صرف لطلاب الصف الثالث..." />
          </Field>
          <button onClick={record} disabled={saving} className="btn-primary" style={{ width: '100%' }}>
            {saving ? <><span className="spinner" /> جارٍ التسجيل...</> : 'تسجيل الحركة'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Excel Import (Inventory Items)
// ============================================================
const INV_COLS = ['nameAr','nameEn','category','sku','quantity','unit','minThreshold','unitPrice','supplier']
const INV_HEADERS: Record<string,string> = { nameAr:'الاسم عربي*', nameEn:'الاسم إنجليزي', category:'الفئة*', sku:'كود SKU', quantity:'الكمية*', unit:'الوحدة', minThreshold:'حد التنبيه', unitPrice:'سعر الوحدة', supplier:'المورد' }

function InventoryImportTab({ notify }: { notify: Notify }) {
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
      if (rows.length < 2) { notify('الملف فارغ', 'error'); return }
      const parsed: Record<string,string>[] = []
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] as string[]
        if (!r[0]) continue
        const obj: Record<string,string> = {}
        INV_COLS.forEach((col, idx) => { obj[col] = String(r[idx] ?? '').trim() })
        parsed.push(obj)
      }
      setPreview(parsed); setFileName(file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  async function doImport() {
    if (!preview.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/staff/inventory/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: preview }) })
      const d = await res.json()
      setResult(d)
      if (res.ok) notify(`تم: ${d.created} جديد، ${d.updated} محدَّث`)
      else notify(d.error || 'فشل الاستيراد', 'error')
    } finally { setSaving(false) }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([INV_COLS.map(c => INV_HEADERS[c]), ['كتاب الرياضيات','Math Book','كتب','BOOK-MATH-1','100','قطعة','10','25','مكتبة النهضة']])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'الأصناف')
    XLSX.writeFile(wb, 'نموذج_استيراد_المخزون.xlsx')
  }

  return (
    <div>
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>📥 استيراد أصناف المخزون من Excel</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '3px' }}>يُضيف الأصناف الجديدة أو يُحدّث الموجودة حسب SKU أو الاسم+الفئة</div>
          </div>
          <button onClick={downloadTemplate} className="btn-outline btn-sm">⬇️ تحميل النموذج</button>
        </div>
        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f) }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#0a5c36' : '#e2e8f0'}`, borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f0fdf4' : '#fafafa', transition: 'all 0.15s' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f) }} />
          <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>📦</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{fileName || 'اسحب ملف Excel هنا أو اضغط للاختيار'}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>.xlsx · .xls · .csv</div>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 700 }}>معاينة — {preview.length} صنف</div>
            <button onClick={doImport} disabled={saving} className="btn-primary">
              {saving ? <><span className="spinner" /> جارٍ الاستيراد...</> : `✅ استيراد ${preview.length} صنف`}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead><tr style={{ background: '#f1f5f9' }}>
                {['الاسم عربي','الفئة','الكمية','الوحدة','سعر الوحدة'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'start', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{preview.slice(0, 10).map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{r.nameAr}</td>
                  <td style={{ padding: '7px 12px' }}>{r.category}</td>
                  <td style={{ padding: '7px 12px', fontWeight: 700, color: '#0a5c36' }}>{r.quantity}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.unit || 'قطعة'}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.unitPrice ? `${r.unitPrice} ج.م` : '—'}</td>
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
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ color: '#15803d' }}>✅ جديد: <strong>{result.created}</strong></span>
            <span style={{ color: '#2563eb' }}>🔄 محدَّث: <strong>{result.updated}</strong></span>
            {result.errors.length > 0 && <span style={{ color: '#dc2626' }}>❌ أخطاء: <strong>{result.errors.length}</strong></span>}
          </div>
          {result.errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>• {e}</div>)}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Grade Distribution
// ============================================================
function DistributeTab({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<ItemOption[]>([])
  const [gradeAr, setGradeAr] = useState('')
  const [distributing, setDistributing] = useState(false)
  const [rows, setRows] = useState<{ itemId: number | ''; qty: string }[]>([{ itemId: '', qty: '1' }])
  const [result, setResult] = useState<{ studentCount: number; results: { nameAr: string; total: number; remaining: number }[] } | null>(null)

  useEffect(() => {
    fetch('/api/staff/inventory').then(r => r.json()).then(d => {
      setItems((d.items ?? []).map((i: ItemRow) => ({ id: i.id, nameAr: i.nameAr, category: i.category, quantity: i.quantity, unit: i.unit })))
    })
  }, [])

  function addRow() { setRows(r => [...r, { itemId: '', qty: '1' }]) }
  function removeRow(idx: number) { setRows(r => r.filter((_, i) => i !== idx)) }
  function setRow(idx: number, key: 'itemId' | 'qty', val: string) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: key === 'itemId' ? (val ? Number(val) : '') : val } : row))
  }

  async function distribute() {
    if (!gradeAr.trim()) { notify('اكتب اسم الصف أولاً', 'error'); return }
    const valid = rows.filter(r => r.itemId && Number(r.qty) > 0)
    if (!valid.length) { notify('أضف صنفًا واحداً على الأقل بكمية أكبر من صفر', 'error'); return }
    if (!confirm(`توزيع المستلزمات على جميع طلاب ${gradeAr}؟ ستُخصم الكميات فورًا من المخزون.`)) return
    setDistributing(true)
    try {
      const res = await fetch('/api/staff/inventory/distribute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeAr, items: valid.map(r => ({ itemId: r.itemId as number, quantityPerStudent: Number(r.qty) })) }),
      })
      const d = await res.json()
      if (res.ok) { setResult(d); notify(`تم توزيع المستلزمات على ${d.studentCount} طالب`) }
      else notify(d.error || 'فشل التوزيع', 'error')
    } finally { setDistributing(false) }
  }

  function exportResult() {
    if (!result) return
    const wsData = [['الصنف','العدد الكلي المُصرف','المتبقي في المخزون']]
    result.results.forEach(r => wsData.push([r.nameAr, String(r.total), String(r.remaining)]))
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'التوزيع')
    XLSX.writeFile(wb, `توزيع_${gradeAr}_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`)
  }

  return (
    <div>
      <div className="card" style={{ padding: '22px', marginBottom: '20px', maxWidth: '600px' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>📋 توزيع مستلزمات على صف دراسي</div>
        <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '18px' }}>تُحسب الكمية الكلية تلقائيًا × عدد الطلاب النشطين في الصف</div>

        <div style={{ marginBottom: '16px' }}>
          <label className="form-label">الصف الدراسي *</label>
          <input className="form-input" value={gradeAr} onChange={e => setGradeAr(e.target.value)} placeholder="مثال: الصف الأول الابتدائي" />
        </div>

        <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem', marginBottom: '10px' }}>الأصناف</div>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <select className="form-input" value={row.itemId} onChange={e => setRow(idx, 'itemId', e.target.value)} style={{ flex: 3 }}>
              <option value="">اختر صنفًا...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.nameAr} (رصيد: {i.quantity} {i.unit})</option>)}
            </select>
            <input className="form-input" type="number" min="1" value={row.qty} onChange={e => setRow(idx, 'qty', e.target.value)} placeholder="كمية/طالب" style={{ flex: 1, minWidth: '80px' }} />
            {rows.length > 1 && <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.1rem', padding: '0 4px' }}>✕</button>}
          </div>
        ))}
        <button onClick={addRow} className="btn-outline btn-sm" style={{ marginBottom: '18px' }}>+ إضافة صنف آخر</button>

        <button onClick={distribute} disabled={distributing} className="btn-primary" style={{ width: '100%' }}>
          {distributing ? <><span className="spinner" /> جارٍ التوزيع...</> : '📦 توزيع الآن'}
        </button>
      </div>

      {result && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>نتيجة التوزيع — {result.studentCount} طالب</div>
            <button onClick={exportResult} className="btn-outline btn-sm">⬇️ تصدير Excel</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.results.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: r.remaining < 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '10px', border: `1px solid ${r.remaining < 0 ? '#fca5a5' : '#86efac'}` }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{r.nameAr}</span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem' }}>
                  <span>صُرف: <strong>{r.total}</strong></span>
                  <span style={{ color: r.remaining < 0 ? '#dc2626' : '#15803d' }}>متبقٍ: <strong>{r.remaining}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Page shell
// ============================================================
export default function InventoryPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const notify: Notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  // cross-tab coordination, consumed once by the receiving tab
  const [openItemId, setOpenItemId] = useState<number | null>(null)
  const [movementItemId, setMovementItemId] = useState<number | null>(null)

  function goToItem(id: number) { setOpenItemId(id); setTab('items') }
  function goToMovement(id: number) { setMovementItemId(id); setTab('movements') }

  return (
    <StaffShell title="المخازن والكتب واليونيفورم" icon="📦" tabs={TABS} active={tab} onTabChange={k => setTab(k as TabKey)}>
      {toast && <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}</div>}
      {tab === 'overview' && <OverviewTab onOpenItem={goToItem} />}
      {tab === 'items' && (
        <ItemsTab
          notify={notify}
          openItemId={openItemId}
          onConsumeOpen={() => setOpenItemId(null)}
          onRecordMovement={goToMovement}
        />
      )}
      {tab === 'movements' && <MovementsTab notify={notify} presetItemId={movementItemId} onConsumePreset={() => setMovementItemId(null)} />}
      {tab === 'import' && <InventoryImportTab notify={notify} />}
      {tab === 'distribute' && <DistributeTab notify={notify} />}
    </StaffShell>
  )
}
