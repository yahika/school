'use client'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'items' | 'movements'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'items', label: 'الأصناف' },
  { key: 'movements', label: 'حركة المخزون' },
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
    </StaffShell>
  )
}
