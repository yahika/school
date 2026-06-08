'use client'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import StaffShell from '../_components/StaffShell'

type TabKey = 'overview' | 'semesters' | 'results'
type Notify = (msg: string, type?: 'success' | 'error') => void

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'semesters', label: 'مراجعة الفصول الدراسية' },
  { key: 'results', label: 'نتائج الطلاب' },
]

const REVIEW_STATUS_META: Record<'pending' | 'approved' | 'needs_changes', { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد المراجعة', color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'معتمدة ✓', color: '#15803d', bg: '#f0fdf4' },
  needs_changes: { label: 'تحتاج تعديل', color: '#dc2626', bg: '#fef2f2' },
}
const RESULT_STATUS_META: Record<'pass' | 'fail', { label: string; color: string; bg: string }> = {
  pass: { label: 'ناجح', color: '#15803d', bg: '#f0fdf4' },
  fail: { label: 'راسب', color: '#dc2626', bg: '#fef2f2' },
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
interface QueueItem { id: number; nameAr: string; nameEn: string; academicYear: string; term: string; totalStudents: number; isPublished: boolean; reviewStatus: string }
interface ReviewedItem { id: number; semesterId: number; nameAr: string; academicYear: string; term: string; status: string; note: string | null; reviewedBy: string | null; reviewedAt: string | null }
interface RCOverview {
  totalSemesters: number; publishedCount: number; unpublishedCount: number
  reviewPending: number; reviewApproved: number; reviewNeedsChanges: number
  totalResults: number; overallPassCount: number; overallFailCount: number; overallPassRate: number
  queue: QueueItem[]; recentlyReviewed: ReviewedItem[]
}

function OverviewTab({ onOpenSemester }: { onOpenSemester: (id: number) => void }) {
  const [data, setData] = useState<RCOverview | null>(null)
  useEffect(() => { fetch('/api/staff/results-control/overview').then(r => r.json()).then(setData) }, [])
  if (!data) return <Loading />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <StatCard icon="📚" label="إجمالي الفصول الدراسية" value={data.totalSemesters} color="#2563eb" />
        <StatCard icon="🌐" label="منشورة لأولياء الأمور" value={data.publishedCount} sub={`${data.unpublishedCount} غير منشورة`} color="#15803d" />
        <StatCard icon="🧐" label="بانتظار المراجعة" value={data.reviewPending} color="#d97706" />
        <StatCard icon="⚠️" label="تحتاج تعديل" value={data.reviewNeedsChanges} color="#dc2626" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <StatCard icon="✅" label="فصول معتمدة" value={data.reviewApproved} color="#15803d" />
        <StatCard icon="🧑‍🎓" label="إجمالي نتائج الطلاب" value={data.totalResults.toLocaleString()} color="#7c3aed" />
        <StatCard icon="📈" label="معدل النجاح العام" value={`${data.overallPassRate}%`} sub={`${data.overallPassCount.toLocaleString()} ناجح · ${data.overallFailCount.toLocaleString()} راسب`} color="#0a5c36" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🔔 بانتظار المراجعة</div>
          {data.queue.length === 0 ? <Empty icon="🎉" text="لا توجد فصول دراسية بانتظار المراجعة — كل شيء معتمد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.queue.map(s => {
                const m = REVIEW_STATUS_META[s.reviewStatus as keyof typeof REVIEW_STATUS_META] ?? REVIEW_STATUS_META.pending
                return (
                  <button key={s.id} onClick={() => onOpenSemester(s.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
                    <span style={{ textAlign: 'start' }}>
                      <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem' }}>{s.nameAr}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{s.academicYear} · {s.term} · {s.totalStudents} طالب{s.isPublished ? ' · 🌐 منشور بالفعل' : ''}</div>
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>🕓 آخر المراجعات</div>
          {data.recentlyReviewed.length === 0 ? <Empty icon="🕓" text="لم تتم أي مراجعة بعد" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recentlyReviewed.map(r => {
                const m = REVIEW_STATUS_META[r.status as keyof typeof REVIEW_STATUS_META] ?? REVIEW_STATUS_META.pending
                return (
                  <div key={r.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem' }}>{r.nameAr}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 11px', borderRadius: '999px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '3px' }}>
                      {r.reviewedBy ? `بواسطة ${r.reviewedBy}` : ''}{r.reviewedAt ? ` · ${new Date(r.reviewedAt).toLocaleString('ar-EG')}` : ''}
                    </div>
                    {r.note ? <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '5px' }}>📝 {r.note}</div> : null}
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
// Semester review (approve / flag + publish gate)
// ============================================================
interface SemesterRow {
  id: number; nameAr: string; nameEn: string; academicYear: string; term: string
  isPublished: boolean; publishedAt: string | null; createdAt: string
  totalStudents: number; passCount: number; failCount: number; passRate: number
  review: { status: string; note: string | null; reviewedBy: string | null; reviewedAt: string | null } | null
}

function SemestersTab({ notify, openSemesterId, onConsumeOpen, onViewResults }: {
  notify: Notify
  openSemesterId: number | null
  onConsumeOpen: () => void
  onViewResults: (semesterId: number) => void
}) {
  const [semesters, setSemesters] = useState<SemesterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [reviewStatus, setReviewStatus] = useState('pending')
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/staff/results-control/semesters').then(r => r.json()).then(d => { setSemesters(d.semesters ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  // open the review panel when asked from elsewhere (e.g. the overview "needs attention" queue)
  useEffect(() => {
    if (openSemesterId != null) { setActiveId(openSemesterId); onConsumeOpen() }
  }, [openSemesterId, onConsumeOpen])

  const active = semesters.find(s => s.id === activeId) ?? null

  // keep the review form synced to whichever semester is active
  useEffect(() => {
    if (active) { setReviewStatus(active.review?.status ?? 'pending'); setReviewNote(active.review?.note ?? '') }
  }, [active?.id])

  function closePanel() { setActiveId(null) }

  async function saveReview() {
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch(`/api/staff/results-control/semesters/${active.id}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: reviewStatus, note: reviewNote }),
      })
      const d = await res.json()
      if (!res.ok) { notify(d.error || 'تعذّر حفظ المراجعة', 'error'); return }
      notify('تم حفظ قرار المراجعة بنجاح')
      load()
    } finally { setSaving(false) }
  }

  async function togglePublish() {
    if (!active) return
    const next = !active.isPublished
    if (!confirm(next
      ? `نشر نتائج «${active.nameAr}» سيجعلها مرئية لأولياء الأمور فورًا. متابعة؟`
      : `إلغاء نشر «${active.nameAr}» سيخفيها عن أولياء الأمور. متابعة؟`)) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/staff/results-control/semesters/${active.id}/publish`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: next }),
      })
      if (res.ok) { notify(next ? 'تم نشر النتائج لأولياء الأمور' : 'تم إلغاء نشر النتائج'); load() }
      else notify('تعذّر تحديث حالة النشر', 'error')
    } finally { setPublishing(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: activeId ? 'minmax(0,1fr) 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        {loading ? <Loading /> : semesters.length === 0 ? (
          <Empty icon="📚" text="لا توجد فصول دراسية مرفوعة بعد" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {semesters.map(s => {
              const status = s.review?.status ?? 'pending'
              const m = REVIEW_STATUS_META[status as keyof typeof REVIEW_STATUS_META] ?? REVIEW_STATUS_META.pending
              return (
                <div key={s.id} onClick={() => setActiveId(s.id)}
                  style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', padding: '14px 18px', border: activeId === s.id ? '2px solid #0a5c36' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{s.nameAr} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.78rem' }}>({s.nameEn})</span></div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>{s.academicYear} · {s.term} · 👥 {s.totalStudents} طالب · 📈 نجاح {s.passRate}%</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: s.isPublished ? '#f0fdf4' : '#f1f5f9', color: s.isPublished ? '#15803d' : '#64748b', whiteSpace: 'nowrap' }}>{s.isPublished ? '🌐 منشور' : '🔒 غير منشور'}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {active && (
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{active.nameAr}</div>
              <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '16px' }}>
              {active.academicYear} · {active.term} · {active.totalStudents} طالب · نجاح {active.passRate}% ({active.passCount} ناجح / {active.failCount} راسب)
            </div>

            <button onClick={() => onViewResults(active.id)} className="btn-outline btn-sm" style={{ width: '100%', marginBottom: '18px' }}>📋 عرض نتائج طلاب هذا الفصل</button>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem', marginBottom: '10px' }}>✅ قرار المراجعة</div>
              <Field label="الحالة">
                <select className="form-input" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}>
                  <option value="pending">قيد المراجعة</option>
                  <option value="approved">معتمدة ✓</option>
                  <option value="needs_changes">تحتاج تعديل</option>
                </select>
              </Field>
              <Field label="ملاحظات المراجعة">
                <textarea className="form-input" rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="مثال: راجع درجات مادة العلوم لطلاب الصف الخامس قبل الاعتماد..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </Field>
              {active.review?.reviewedBy ? (
                <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: '10px' }}>
                  آخر مراجعة بواسطة {active.review.reviewedBy}{active.review.reviewedAt ? ` · ${new Date(active.review.reviewedAt).toLocaleString('ar-EG')}` : ''}
                </div>
              ) : null}
              <button onClick={saveReview} disabled={saving} className="btn-primary" style={{ width: '100%' }}>
                {saving ? <><span className="spinner" /> جارٍ الحفظ...</> : 'حفظ قرار المراجعة'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.86rem', marginBottom: '8px' }}>🌐 النشر لأولياء الأمور</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '12px' }}>
                {active.isPublished ? 'هذه النتائج منشورة الآن — يمكن لأولياء الأمور رؤيتها في حساباتهم.' : 'هذه النتائج غير منشورة بعد — لا يستطيع أولياء الأمور رؤيتها.'}
              </div>
              <button onClick={togglePublish} disabled={publishing} className={active.isPublished ? 'btn-danger' : 'btn-primary'} style={{ width: '100%' }}>
                {publishing ? <><span className="spinner" /> جارٍ التنفيذ...</> : active.isPublished ? '🔒 إلغاء النشر' : '🌐 نشر النتائج لأولياء الأمور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Student results browser (search + subject breakdown)
// ============================================================
interface ResultRow { id: number; seatNumber: string; nameAr: string; nameEn: string | null; gradeAr: string; gradeEn: string | null; totalScore: number; maxScore: number; percentage: number; status: string; letterGrade: string | null; rank: number | null }
interface SubjectRow { id: number; nameAr: string; nameEn: string | null; score: number; maxScore: number; passMark: number; status: string }
interface ResultDetail extends ResultRow { subjects: SubjectRow[] }

function ResultsTab({ presetSemesterId, onConsumePreset }: { presetSemesterId: number | null; onConsumePreset: () => void }) {
  const [semesters, setSemesters] = useState<{ id: number; nameAr: string; academicYear: string; term: string }[]>([])
  const [semesterId, setSemesterId] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<ResultDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // self-fetch a lightweight semester list for the picker (avoids staleness from other tabs)
  useEffect(() => {
    fetch('/api/staff/results-control/semesters').then(r => r.json()).then(d => {
      const list = (d.semesters ?? []) as SemesterRow[]
      setSemesters(list.map(s => ({ id: s.id, nameAr: s.nameAr, academicYear: s.academicYear, term: s.term })))
    })
  }, [])

  // honor a preset coming from the Semester Review tab's "view results" button — consumed once
  useEffect(() => {
    if (presetSemesterId != null) { setSemesterId(presetSemesterId); onConsumePreset() }
  }, [presetSemesterId, onConsumePreset])

  // otherwise default to the most recent semester once the list loads
  useEffect(() => {
    if (semesterId === '' && semesters.length > 0) setSemesterId(semesters[0].id)
  }, [semesters, semesterId])

  const load = useCallback(() => {
    if (semesterId === '') { setResults([]); return }
    setLoading(true)
    const qs = new URLSearchParams({ semesterId: String(semesterId) })
    if (search) qs.set('search', search)
    if (status) qs.set('status', status)
    fetch(`/api/staff/results-control/results?${qs.toString()}`).then(r => r.json()).then(d => { setResults(d.results ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [semesterId, search, status])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function changeSemester(value: string) {
    setSemesterId(value ? Number(value) : '')
    setExpandedId(null); setDetail(null)
  }

  function toggleExpand(r: ResultRow) {
    if (expandedId === r.id) { setExpandedId(null); setDetail(null); return }
    setExpandedId(r.id); setDetail(null); setDetailLoading(true)
    fetch(`/api/staff/results-control/results/${r.id}`).then(res => res.json()).then(d => { setDetail(d.result ?? null); setDetailLoading(false) }).catch(() => setDetailLoading(false))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <select value={semesterId} onChange={e => changeSemester(e.target.value)} className="form-input" style={{ width: 'auto', minWidth: '230px', padding: '9px 14px' }}>
          <option value="">اختر فصلاً دراسيًا...</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.nameAr} · {s.academicYear} · {s.term}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس"
          style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem' }} />
        <select value={status} onChange={e => setStatus(e.target.value)} className="form-input" style={{ width: 'auto', padding: '9px 14px' }}>
          <option value="">كل الحالات</option>
          <option value="pass">ناجح</option>
          <option value="fail">راسب</option>
        </select>
      </div>

      {semesterId === '' ? (
        <Empty icon="📋" text="اختر فصلاً دراسيًا لعرض نتائج طلابه" />
      ) : loading ? <Loading /> : results.length === 0 ? (
        <Empty icon="🧑‍🎓" text={search || status ? 'لا توجد نتائج مطابقة' : 'لا توجد نتائج في هذا الفصل الدراسي'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map(r => {
            const m = RESULT_STATUS_META[r.status as keyof typeof RESULT_STATUS_META] ?? RESULT_STATUS_META.fail
            const expanded = expandedId === r.id
            return (
              <div key={r.id} style={{ background: 'white', borderRadius: '12px', border: expanded ? '2px solid #0a5c36' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div onClick={() => toggleExpand(r)} style={{ cursor: 'pointer', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{r.nameAr} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.76rem' }}>· #{r.seatNumber}</span></div>
                    <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '2px' }}>{r.gradeAr}{r.rank ? ` · 🏅 الترتيب ${r.rank}` : ''}{r.letterGrade ? ` · ${r.letterGrade}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{r.totalScore} / {r.maxScore}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.percentage}%</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.bg, color: m.color }}>{m.label}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{expanded ? '▲' : '▼'}</span>
                </div>
                {expanded && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 18px', background: '#f8fafc' }}>
                    {detailLoading ? <Loading /> : !detail ? (
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>تعذّر تحميل تفاصيل المواد</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {detail.subjects.map(sub => {
                          const sm = RESULT_STATUS_META[sub.status as keyof typeof RESULT_STATUS_META] ?? RESULT_STATUS_META.fail
                          return (
                            <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{sub.nameAr}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{sub.score} / {sub.maxScore}</span>
                                <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 9px', borderRadius: '999px', background: sm.bg, color: sm.color }}>{sm.label}</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Page shell
// ============================================================
export default function ResultsControlPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const notify: Notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  // cross-tab coordination, consumed once by the receiving tab
  const [openReviewId, setOpenReviewId] = useState<number | null>(null)
  const [resultsSemesterId, setResultsSemesterId] = useState<number | null>(null)

  function goToReview(id: number) { setOpenReviewId(id); setTab('semesters') }
  function goToResults(id: number) { setResultsSemesterId(id); setTab('results') }

  return (
    <StaffShell title="كونترول النتائج" icon="📋" tabs={TABS} active={tab} onTabChange={k => setTab(k as TabKey)}>
      {toast && <div className={`toast ${toast.type}`} style={{ marginBottom: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}</div>}
      {tab === 'overview' && <OverviewTab onOpenSemester={goToReview} />}
      {tab === 'semesters' && (
        <SemestersTab
          notify={notify}
          openSemesterId={openReviewId}
          onConsumeOpen={() => setOpenReviewId(null)}
          onViewResults={goToResults}
        />
      )}
      {tab === 'results' && <ResultsTab presetSemesterId={resultsSemesterId} onConsumePreset={() => setResultsSemesterId(null)} />}
    </StaffShell>
  )
}
