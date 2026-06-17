'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ════════════════════════════════════════════════════════════════════════════
// Principal Dashboard — operational daily briefing.
// Covers: attendance, buses, conduct, finance, inventory alerts,
// results control, and pending applications — all from one screen.
// ════════════════════════════════════════════════════════════════════════════

interface BusInfo {
  id: number; code: string; status: string; driverName: string | null
  routeAr: string | null; capacity: number; riderCount: number
}
interface ConductNote {
  id: number; seatNumber: string; studentName: string; gradeAr: string
  type: string; description: string; date: string; recordedBy: string | null
}
interface Payment { studentName: string; gradeAr: string | null; amount: number; paidAt: string | null }
interface LowStockItem { id: number; nameAr: string; category: string; quantity: number; unit: string; minThreshold: number }
interface GradeCount { gradeAr: string; count: number }
interface LatestSemester { nameAr: string; academicYear: string; publishedAt: string | null }

interface PrincipalData {
  generatedAt: string; today: string; totalActiveStudents: number; alerts: number
  attendance: { taken: boolean; present: number; absent: number; late: number; excused: number; totalMarked: number; rate: number | null }
  buses: BusInfo[]; busStats: { total: number; active: number; maintenance: number }
  conduct: { recent: ConductNote[]; negativeCount: number; positiveCount: number }
  finance: { collected: number; outstanding: number; totalExpected: number; collectionRate: number; overdueCount: number; monthExpenses: number; monthExpenseCount: number; recentPayments: Payment[] }
  inventory: { lowStockItems: LowStockItem[]; lowStockCount: number }
  results: { pendingReviewCount: number; latestSemester: LatestSemester | null }
  applications: { pendingCount: number }
  gradeBreakdown: GradeCount[]
}

function fmtMoney(n: number) { return `${Math.round(n).toLocaleString('en-US')} ج.م` }
function todayLabel() {
  return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
}

const CONDUCT_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  positive: { label: 'إيجابية', color: '#15803d', bg: '#f0fdf4', icon: '⭐' },
  negative: { label: 'سلبية', color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
  note: { label: 'ملاحظة', color: '#475569', bg: '#f1f5f9', icon: '📝' },
}
const BUS_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'نشط', color: '#15803d', dot: '#22c55e' },
  maintenance: { label: 'صيانة', color: '#d97706', dot: '#f59e0b' },
  inactive: { label: 'متوقف', color: '#dc2626', dot: '#ef4444' },
}
const CATEGORY_ICONS: Record<string, string> = { 'كتب': '📚', 'يونيفورم': '👔', 'قرطاسية': '✏️', 'أخرى': '📦' }

// ── Reusable section card ────────────────────────────────────────────────────
function Section({ title, icon, accent = '#5b21b6', children, link, linkLabel }: {
  title: string; icon: string; accent?: string; children: React.ReactNode
  link?: string; linkLabel?: string
}) {
  return (
    <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ background: accent + '08', borderBottom: '1px solid ' + accent + '22', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{title}</span>
        </div>
        {link && (
          <a href={link} style={{ fontSize: '0.78rem', color: accent, fontWeight: 700, textDecoration: 'none', background: accent + '12', padding: '4px 12px', borderRadius: '999px' }}>
            {linkLabel ?? 'فتح'} ←
          </a>
        )}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

// ── KPI card at top ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, bg, alert }: {
  icon: string; label: string; value: string | number; sub?: string; color: string; bg: string; alert?: boolean
}) {
  return (
    <div style={{ background: bg, borderRadius: '16px', padding: '20px', border: `1px solid ${color}30`, position: 'relative', overflow: 'hidden' }}>
      {alert && (
        <div style={{ position: 'absolute', top: '12px', insetInlineEnd: '12px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px #fca5a530' }} />
      )}
      <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{label}</div>
      {sub && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════════════════════════════════
export default function PrincipalDashboard() {
  const router = useRouter()
  const [me, setMe] = useState<{ name: string } | null>(null)
  const [data, setData] = useState<PrincipalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [meRes, dataRes] = await Promise.all([
        fetch('/api/staff/me'),
        fetch('/api/staff/principal/overview'),
      ])
      if (!meRes.ok || !dataRes.ok) { router.push('/staff/login'); return }
      const [meData, overview] = await Promise.all([meRes.json(), dataRes.json()])
      setMe(meData)
      setData(overview)
      setLastRefresh(new Date())
    } catch { router.push('/staff/login') }
    finally { setLoading(false); setRefreshing(false) }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function logout() {
    await fetch('/api/staff/logout', { method: 'POST' })
    router.push('/staff/login')
  }

  if (loading) return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap')`}</style>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏫</div>
        <div style={{ fontWeight: 700 }}>جارٍ تحميل لوحة المدير...</div>
      </div>
    </div>
  )

  const d = data!
  const att = d.attendance
  const fin = d.finance

  // attendance row items
  const attRows = [
    { label: 'حاضر', value: att.present, color: '#15803d', bg: '#f0fdf4' },
    { label: 'غائب', value: att.absent, color: '#dc2626', bg: '#fef2f2' },
    { label: 'متأخر', value: att.late, color: '#d97706', bg: '#fffbeb' },
    { label: 'مستأذن', value: att.excused, color: '#2563eb', bg: '#eff6ff' },
  ]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Tajawal, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        .live-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .att-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bus-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(135deg,#5b21b6,#6d28d9)',
        padding: '0 28px', height: '70px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 4px 20px rgba(10,92,54,0.25)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🏫</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>لوحة المدير</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>المتابعة اليومية · المدرسة الأمريكية</div>
          </div>
        </a>

        {/* live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '5px 14px', border: '1px solid rgba(255,255,255,0.18)' }}>
          <div className="live-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.76rem', fontWeight: 700 }}>مباشر</span>
        </div>

        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* refresh */}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600 }}>
            {refreshing ? '⏳' : '🔄'} تحديث
          </button>
          {me && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600 }}>{me.name}</div>}
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600 }}>
            خروج 🚪
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>

        {/* ── DATE BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.3rem' }}>البلاغ اليومي</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{todayLabel()}</div>
          </div>
          {lastRefresh && (
            <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>

        {/* ── TOP KPIs ── */}
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <KpiCard
            icon="🧑‍🎓" label="نسبة الحضور اليوم"
            value={att.taken ? `${att.rate ?? 0}%` : '—'}
            sub={att.taken ? `${att.present} من ${att.totalMarked} مُسجَّل` : 'لم يُسجَّل الحضور بعد'}
            color={att.rate !== null && att.rate < 80 ? '#dc2626' : '#15803d'}
            bg={att.rate !== null && att.rate < 80 ? '#fef2f2' : '#f0fdf4'}
            alert={att.rate !== null && att.rate < 80}
          />
          <KpiCard
            icon="🚌" label="الباصات النشطة"
            value={`${d.busStats.active} / ${d.busStats.total}`}
            sub={d.busStats.maintenance > 0 ? `${d.busStats.maintenance} في الصيانة ⚠️` : 'كل الباصات سليمة'}
            color={d.busStats.maintenance > 0 ? '#d97706' : '#15803d'}
            bg={d.busStats.maintenance > 0 ? '#fffbeb' : '#f0fdf4'}
            alert={d.busStats.maintenance > 0}
          />
          <KpiCard
            icon="💰" label="نسبة تحصيل الرسوم"
            value={`${fin.collectionRate}%`}
            sub={`${fin.overdueCount} طالب غير مسدِّد`}
            color={fin.collectionRate < 60 ? '#dc2626' : fin.collectionRate < 85 ? '#d97706' : '#15803d'}
            bg={fin.collectionRate < 60 ? '#fef2f2' : fin.collectionRate < 85 ? '#fffbeb' : '#f0fdf4'}
            alert={fin.overdueCount > 10}
          />
          <KpiCard
            icon="🔔" label="إجمالي التنبيهات"
            value={d.alerts}
            sub={[
              d.applications.pendingCount > 0 && `${d.applications.pendingCount} طلب تسجيل`,
              d.inventory.lowStockCount > 0 && `${d.inventory.lowStockCount} صنف منخفض`,
              d.results.pendingReviewCount > 0 && `${d.results.pendingReviewCount} مراجعة`,
            ].filter(Boolean).join(' · ') || 'لا تنبيهات حرجة'}
            color={d.alerts > 0 ? '#7c3aed' : '#15803d'}
            bg={d.alerts > 0 ? '#f5f3ff' : '#f0fdf4'}
            alert={d.alerts > 3}
          />
        </div>

        {/* ── MAIN GRID (2 columns) ── */}
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ATTENDANCE */}
            <Section title="الحضور والغياب اليوم" icon="📋" accent="#5b21b6" link="/staff/student-affairs" linkLabel="شؤون الطلبة">
              {!att.taken ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                  <div style={{ fontWeight: 700 }}>لم يُسجَّل الحضور بعد لهذا اليوم</div>
                </div>
              ) : (
                <div>
                  {/* big rate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#5b21b6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontWeight: 900, fontSize: '1.15rem' }}>{att.rate}%</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{att.present} طالب حاضر</div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>من أصل {att.totalMarked} مُسجَّل اليوم</div>
                    </div>
                  </div>
                  <ProgressBar pct={att.rate ?? 0} color="#22c55e" />
                  <div className="att-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '14px' }}>
                    {attRows.map(r => (
                      <div key={r.label} style={{ background: r.bg, borderRadius: '12px', padding: '12px', textAlign: 'center', border: `1px solid ${r.color}25` }}>
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', color: r.color }}>{r.value}</div>
                        <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '2px', fontWeight: 600 }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* BUSES */}
            <Section title="حالة الباصات" icon="🚌" accent="#2563eb" link="/staff/buses" linkLabel="إدارة الباصات">
              {d.buses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.88rem' }}>لا توجد باصات مسجلة</div>
              ) : (
                <div className="bus-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {d.buses.map(bus => {
                    const meta = BUS_STATUS[bus.status] ?? BUS_STATUS.inactive
                    const fillPct = bus.capacity > 0 ? Math.round((bus.riderCount / bus.capacity) * 100) : 0
                    return (
                      <div key={bus.id} style={{
                        background: '#f8fafc', borderRadius: '14px', padding: '14px',
                        border: `1.5px solid ${meta.color}30`,
                        borderRight: `4px solid ${meta.color}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>🚌 {bus.code}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.dot }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                          </div>
                        </div>
                        {bus.routeAr && <div style={{ color: '#475569', fontSize: '0.78rem', marginBottom: '6px' }}>📍 {bus.routeAr}</div>}
                        {bus.driverName && <div style={{ color: '#64748b', fontSize: '0.76rem', marginBottom: '8px' }}>👤 {bus.driverName}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{bus.riderCount} / {bus.capacity} راكب</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: fillPct > 90 ? '#dc2626' : '#5b21b6' }}>{fillPct}%</span>
                        </div>
                        <ProgressBar pct={fillPct} color={fillPct > 90 ? '#ef4444' : '#22c55e'} />
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* CONDUCT */}
            <Section title="السلوكيات الأخيرة (7 أيام)" icon="🔍" accent="#7c3aed" link="/staff/student-affairs" linkLabel="شؤون الطلبة">
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1, background: '#fef2f2', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', border: '1px solid #fca5a530' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#dc2626' }}>{d.conduct.negativeCount}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>⚠️ سلبية</div>
                </div>
                <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', border: '1px solid #86efac30' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#15803d' }}>{d.conduct.positiveCount}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>⭐ إيجابية</div>
                </div>
              </div>
              {d.conduct.recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>لا توجد ملاحظات سلوكية خلال آخر 7 أيام</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {d.conduct.recent.map(c => {
                    const meta = CONDUCT_META[c.type] ?? CONDUCT_META.note
                    return (
                      <div key={c.id} style={{ background: meta.bg, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${meta.color}20`, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{c.studentName}</span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{fmtDate(c.date)}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.gradeAr} · {c.description.slice(0, 60)}{c.description.length > 60 ? '...' : ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* FINANCE */}
            <Section title="الحسابات والمالية" icon="💰" accent="#d97706" link="/staff/accounts" linkLabel="الحسابات">
              {/* collection rate bar */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>نسبة التحصيل الكلية</span>
                  <span style={{ fontWeight: 900, color: fin.collectionRate < 70 ? '#dc2626' : '#15803d' }}>{fin.collectionRate}%</span>
                </div>
                <ProgressBar pct={fin.collectionRate} color={fin.collectionRate < 70 ? '#ef4444' : '#22c55e'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'إجمالي المحصَّل', value: fmtMoney(fin.collected), color: '#15803d', bg: '#f0fdf4' },
                  { label: 'المتأخر / غير مسدَّد', value: fmtMoney(fin.outstanding), color: '#dc2626', bg: '#fef2f2' },
                  { label: 'مصروفات هذا الشهر', value: fmtMoney(fin.monthExpenses), color: '#d97706', bg: '#fffbeb' },
                  { label: 'عدد المتأخرين', value: `${fin.overdueCount} طالب`, color: '#7c3aed', bg: '#f5f3ff' },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: '12px', padding: '12px', border: `1px solid ${item.color}20` }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {/* recent payments */}
              {fin.recentPayments.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>آخر المدفوعات</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {fin.recentPayments.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{p.studentName}</div>
                          {p.gradeAr && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.gradeAr}</div>}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>{fmtMoney(p.amount)}</div>
                          {p.paidAt && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmtTime(p.paidAt)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* INVENTORY ALERTS */}
            <Section title="تنبيهات المخزون" icon="📦" accent="#dc2626" link="/staff/inventory" linkLabel="المخازن">
              {d.inventory.lowStockCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#15803d' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>كل الأصناف في مستوى آمن</div>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid #fca5a530', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>{d.inventory.lowStockCount} صنف وصل للحد الأدنى أو تجاوزه</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {d.inventory.lowStockItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fff5f5', borderRadius: '10px', border: '1px solid #fca5a530' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{CATEGORY_ICONS[item.category] ?? '📦'}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{item.nameAr}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.category}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 900, color: item.quantity === 0 ? '#dc2626' : '#d97706', fontSize: '1rem' }}>{item.quantity}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>حد: {item.minThreshold} {item.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* RESULTS + APPLICATIONS side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* results */}
              <Section title="كونترول النتائج" icon="📋" accent="#0ea5e9" link="/staff/results-control">
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: d.results.pendingReviewCount > 0 ? '#d97706' : '#15803d' }}>
                    {d.results.pendingReviewCount}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>فصل بانتظار المراجعة</div>
                  {d.results.latestSemester && (
                    <div style={{ marginTop: '12px', background: '#f0fdf4', borderRadius: '10px', padding: '8px 10px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#5b21b6' }}>آخر منشور</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: '2px' }}>{d.results.latestSemester.nameAr}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.results.latestSemester.academicYear}</div>
                    </div>
                  )}
                </div>
              </Section>
              {/* applications */}
              <Section title="طلبات التسجيل" icon="📝" accent="#8b5cf6" link="/admin/applications">
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: d.applications.pendingCount > 0 ? '#7c3aed' : '#15803d' }}>
                    {d.applications.pendingCount}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>طلب قيد الانتظار</div>
                  {d.applications.pendingCount > 0 && (
                    <div style={{ marginTop: '12px', background: '#f5f3ff', borderRadius: '10px', padding: '8px 10px', border: '1px solid #c4b5fd50' }}>
                      <div style={{ fontSize: '0.76rem', color: '#7c3aed', fontWeight: 700 }}>يحتاج مراجعة ورد</div>
                    </div>
                  )}
                </div>
              </Section>
            </div>

          </div>
        </div>

        {/* ── GRADE BREAKDOWN ── */}
        {d.gradeBreakdown.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Section title="توزيع الطلاب على الصفوف" icon="🎓" accent="#5b21b6">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {d.gradeBreakdown.map(g => (
                  <div key={g.gradeAr} style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px 16px', border: '1px solid #bbf7d0', textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#5b21b6' }}>{g.count}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{g.gradeAr}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── QUICK LINKS ── */}
        <div style={{ marginTop: '20px', background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginBottom: '14px' }}>⚡ روابط سريعة</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'شؤون الطلبة', icon: '🎓', href: '/staff/student-affairs', color: '#5b21b6' },
              { label: 'الباصات', icon: '🚌', href: '/staff/buses', color: '#2563eb' },
              { label: 'الحسابات', icon: '💰', href: '/staff/accounts', color: '#d97706' },
              { label: 'كونترول النتائج', icon: '📋', href: '/staff/results-control', color: '#0ea5e9' },
              { label: 'المخازن', icon: '📦', href: '/staff/inventory', color: '#7c3aed' },
              { label: 'لوحة الإدارة', icon: '🛠️', href: '/admin/dashboard', color: '#64748b' },
              { label: 'الطلبات', icon: '📝', href: '/admin/applications', color: '#8b5cf6' },
            ].map(link => (
              <a key={link.href} href={link.href} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: link.color + '0f', border: `1.5px solid ${link.color}25`,
                color: link.color, borderRadius: '10px', padding: '9px 16px',
                textDecoration: 'none', fontWeight: 700, fontSize: '0.84rem',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = link.color + '18' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = link.color + '0f' }}
              >
                <span>{link.icon}</span> {link.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.74rem', marginTop: '28px', paddingBottom: '20px' }}>
          البيانات محدَّثة لحظة بلحظة من كل الأقسام · {d.totalActiveStudents} طالب نشط مسجَّل
        </div>

      </div>
    </div>
  )
}
