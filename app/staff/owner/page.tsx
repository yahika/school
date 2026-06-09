'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ════════════════════════════════════════════════════════════════════════════
// Owner portal — a single live snapshot of every department for the school's
// owner. Read-only "executive view": dark, gold-accented, built for someone
// who wants the whole operation at a glance, not a tool to edit records with.
// ════════════════════════════════════════════════════════════════════════════

interface GradeCount { gradeAr: string; count: number }
interface DeptCount { department: string; labelAr: string; icon: string; count: number }
interface OwnerOverview {
  generatedAt: string
  students: { total: number; active: number; newThisMonth: number; gradeBreakdown: GradeCount[] }
  buses: { totalBuses: number; totalRiders: number; totalCapacity: number; utilization: number; byStatus: Record<string, number> }
  finance: { totalCollected: number; totalExpected: number; totalExpenses: number; netBalance: number; outstanding: number; collectionRate: number }
  inventory: { totalItems: number; lowStockCount: number; estimatedValue: number }
  staff: { total: number; active: number; byDepartment: DeptCount[] }
  results: { totalSemesters: number; published: number; pendingReviews: number }
}

function fmtNum(n: number) { return Math.round(n).toLocaleString('en-US') }
function fmtMoney(n: number) { return `${fmtNum(n)} ج.م` }

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'مساء الخير'
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'مساء الخير'
  return 'مساء الخير'
}

function todayLabel() {
  return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Animated count-up number ─────────────────────────────────────────────────
function Counter({ value, run, format }: { value: number; run: boolean; format?: (n: number) => string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) { setN(value); return }
    let raf = 0
    const start = performance.now()
    const dur = 1200
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, run])
  return <>{format ? format(n) : fmtNum(n)}</>
}

// ── Cinematic welcome intro ──────────────────────────────────────────────────
function IntroOverlay({ name, onDone }: { name: string; onDone: () => void }) {
  const [stage, setStage] = useState(0)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 250),   // crest appears
      setTimeout(() => setStage(2), 1000),  // gold line draws
      setTimeout(() => setStage(3), 1550),  // greeting text
      setTimeout(() => setStage(4), 2350),  // subtitle
      setTimeout(() => setStage(5), 3150),  // enter button
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  function finish() {
    if (closing) return
    setClosing(true)
    setTimeout(onDone, 520)
  }

  return (
    <div
      onClick={finish}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 40%, #102243 0%, #060c1a 60%, #03060f 100%)',
        opacity: closing ? 0 : 1, transition: 'opacity 0.5s ease',
        textAlign: 'center', padding: '24px', overflow: 'hidden',
      }}
    >
      {/* drifting gold particles / grid ambience */}
      <div className="owner-grid-veil" />
      <div className="owner-glow-orb" />

      {/* crest */}
      <div style={{
        width: '92px', height: '92px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.4rem', position: 'relative', marginBottom: '26px',
        background: 'linear-gradient(135deg,#1a2c52,#0c1730)',
        border: '1px solid rgba(200,151,43,0.45)',
        opacity: stage >= 1 ? 1 : 0,
        transform: stage >= 1 ? 'scale(1)' : 'scale(0.6)',
        transition: 'opacity 0.7s cubic-bezier(.2,.8,.2,1), transform 0.7s cubic-bezier(.2,.8,.2,1)',
        boxShadow: stage >= 1 ? '0 0 0 1px rgba(200,151,43,0.15), 0 0 50px rgba(200,151,43,0.35)' : 'none',
      }}>
        <span className={stage >= 1 ? 'owner-crest-pulse' : ''}>👑</span>
      </div>

      {/* gold divider that draws left→right */}
      <div style={{ width: '180px', height: '2px', marginBottom: '22px', background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0', height: '100%',
          background: 'linear-gradient(90deg,#a07820,#e5b850,#a07820)',
          width: stage >= 2 ? '100%' : '0%',
          transition: 'width 0.9s cubic-bezier(.2,.8,.2,1)',
        }} />
      </div>

      {/* greeting */}
      <div style={{
        fontSize: 'clamp(1.5rem, 4.4vw, 2.4rem)', fontWeight: 800, color: 'white', letterSpacing: '0.01em',
        opacity: stage >= 3 ? 1 : 0, transform: stage >= 3 ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease', marginBottom: '10px',
      }}>
        {timeGreeting()} يا أستاذ <span style={{ color: 'var(--owner-gold)' }}>{name || 'صاحب المدرسة'}</span>
      </div>

      {/* subtitle */}
      <div style={{
        fontSize: '0.98rem', color: 'rgba(255,255,255,0.55)', maxWidth: '420px', lineHeight: 1.8,
        opacity: stage >= 4 ? 1 : 0, transform: stage >= 4 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
      }}>
        كل أرقام مدرستك — الطلاب، الباصات، الماليات، المخازن، والفريق — في مكان واحد، محدثة لحظة بلحظة.
      </div>

      {/* enter cta */}
      <button
        onClick={(e) => { e.stopPropagation(); finish() }}
        style={{
          marginTop: '34px', padding: '12px 34px', borderRadius: '999px', fontFamily: 'inherit',
          background: 'linear-gradient(135deg,#c8972b,#a07820)', color: '#1a1304', border: 'none',
          fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', letterSpacing: '0.02em',
          boxShadow: '0 10px 32px rgba(200,151,43,0.35)',
          opacity: stage >= 5 ? 1 : 0, transform: stage >= 5 ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          pointerEvents: stage >= 5 ? 'auto' : 'none',
        }}
      >
        عرض اللوحة ←
      </button>

      <div style={{
        position: 'absolute', bottom: '22px', fontSize: '0.74rem', color: 'rgba(255,255,255,0.28)',
        opacity: stage >= 5 ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        اضغط في أي مكان للمتابعة
      </div>
    </div>
  )
}

// ── Small presentational bits ────────────────────────────────────────────────
function SectionCard({ title, icon, accent, children, wide }: { title: string; icon: string; accent: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="owner-card" style={{ gridColumn: wide ? 'span 2' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.15rem', background: accent + '22', border: `1px solid ${accent}44`,
        }}>{icon}</div>
        <div style={{ fontWeight: 800, color: '#eef2ff', fontSize: '0.98rem', letterSpacing: '0.01em' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
      <div style={{ fontSize: '1.7rem', fontWeight: 900, color: accent ?? '#eef2ff', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(238,242,255,0.5)', marginTop: '3px' }}>{label}{sub ? <span style={{ color: 'rgba(238,242,255,0.3)' }}> · {sub}</span> : null}</div>
    </div>
  )
}

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'rgba(238,242,255,0.6)', marginBottom: '4px' }}>
        <span>{label}</span><span style={{ fontWeight: 800, color: '#eef2ff' }}>{count}</span>
      </div>
      <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div className="owner-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Pill({ text, color }: { text: string; color: string }) {
  return <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: '999px', background: color + '22', color, border: `1px solid ${color}44` }}>{text}</span>
}

// ════════════════════════════════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════════════════════════════════
export default function OwnerPortalPage() {
  const router = useRouter()
  const [me, setMe] = useState<{ name: string } | null>(null)
  const [data, setData] = useState<OwnerOverview | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [statsReady, setStatsReady] = useState(false)

  useEffect(() => {
    // Check if intro should show for this session
    if (typeof window !== 'undefined' && !sessionStorage.getItem('owner-intro-seen')) {
      setShowIntro(true)
    }
    // Fetch who I am + overview data in parallel
    Promise.all([
      fetch('/api/staff/me').then(r => r.ok ? r.json() : null),
      fetch('/api/staff/owner/overview').then(r => r.ok ? r.json() : null),
    ]).then(([meData, overview]) => {
      setMe(meData)
      setData(overview)
    })
  }, [])

  // Trigger count-up after intro finishes (or immediately if no intro)
  function handleIntroDone() {
    sessionStorage.setItem('owner-intro-seen', '1')
    setShowIntro(false)
    setTimeout(() => setStatsReady(true), 200)
  }

  useEffect(() => {
    if (!showIntro && data) setStatsReady(true)
  }, [showIntro, data])

  async function logout() {
    await fetch('/api/staff/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const ownerName = me?.name ?? '...'
  const d = data

  return (
    <div dir="rtl" style={{ minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', background: 'var(--owner-bg)' }}>
      {/* ── Injected styles ─────────────────────────────────────────── */}
      <style>{`
        :root {
          --owner-bg:        #070c18;
          --owner-surface:   #0e1524;
          --owner-border:    rgba(200,151,43,0.18);
          --owner-gold:      #c8972b;
          --owner-gold-l:    #e5b850;
          --owner-gold-d:    #a07820;
          --owner-text:      #eef2ff;
          --owner-muted:     rgba(238,242,255,0.45);
        }
        @keyframes ownerFadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes ownerGlow {
          0%,100% { box-shadow: 0 0 18px rgba(200,151,43,0.15); }
          50%     { box-shadow: 0 0 40px rgba(200,151,43,0.35); }
        }
        @keyframes ownerCrestPulse {
          0%,100% { filter: drop-shadow(0 0 6px rgba(200,151,43,0.4)); }
          50%     { filter: drop-shadow(0 0 18px rgba(229,184,80,0.8)); }
        }
        @keyframes ownerBarFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes ownerGridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .owner-grid-veil {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(200,151,43,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,151,43,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: ownerGridDrift 8s linear infinite;
        }
        .owner-glow-orb {
          position: absolute; top: 30%; left: 50%; transform: translate(-50%,-50%);
          width: 520px; height: 520px; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,151,43,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .owner-crest-pulse { animation: ownerCrestPulse 2.8s ease-in-out infinite; }
        .owner-card {
          background: var(--owner-surface);
          border: 1px solid var(--owner-border);
          border-radius: 16px;
          padding: 22px 24px;
          animation: ownerFadeUp 0.5s ease both;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .owner-card:hover {
          border-color: rgba(200,151,43,0.38);
          box-shadow: 0 4px 28px rgba(200,151,43,0.08);
        }
        .owner-bar-fill {
          height: 100%; border-radius: 4px; transform-origin: left;
          animation: ownerBarFill 1.1s cubic-bezier(.2,.8,.2,1) both;
        }
        @media(max-width: 900px) {
          .owner-two-col { grid-template-columns: 1fr !important; }
          .owner-card[style*="span 2"] { grid-column: span 1 !important; }
        }
      `}</style>

      {/* ── Cinematic intro overlay ─────────────────────────────────── */}
      {showIntro && (
        <IntroOverlay
          name={me?.name ?? ''}
          onDone={handleIntroDone}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #0b1327 0%, #0e1c3a 100%)',
        borderBottom: '1px solid var(--owner-border)',
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '14px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      }}>
        {/* emblem */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #c8972b, #a07820)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', boxShadow: '0 4px 16px rgba(200,151,43,0.35)',
        }}>👑</div>
        <div>
          <div style={{ color: 'var(--owner-gold-l)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
            بوابة صاحب المدرسة
          </div>
          <div style={{ color: 'var(--owner-muted)', fontSize: '0.72rem' }}>الأكاديمية الأمريكية · نظرة شاملة</div>
        </div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {me && (
            <div style={{ textAlign: 'end' }}>
              <div style={{ color: 'var(--owner-text)', fontWeight: 700, fontSize: '0.88rem' }}>{me.name}</div>
              <div style={{ color: 'var(--owner-muted)', fontSize: '0.72rem' }}>صاحب المدرسة</div>
            </div>
          )}
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.65)', borderRadius: '10px', padding: '8px 18px',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
          }}>خروج 🚪</button>
        </div>
      </header>

      {/* ── Hero greeting ───────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1930 0%, #101f40 50%, #0d1930 100%)',
        borderBottom: '1px solid var(--owner-border)',
        padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 900, color: 'var(--owner-text)' }}>
            {timeGreeting()} يا أستاذ <span style={{ color: 'var(--owner-gold-l)' }}>{ownerName}</span> 👑
          </div>
          <div style={{ color: 'var(--owner-muted)', fontSize: '0.87rem', marginTop: '5px' }}>{todayLabel()}</div>
        </div>
        {d && (
          <div style={{ fontSize: '0.75rem', color: 'var(--owner-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
            آخر تحديث: {new Date(d.generatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            <a href="/staff/owner" onClick={e => { e.preventDefault(); window.location.reload() }}
              style={{ marginInlineStart: '8px', color: 'var(--owner-gold)', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>↺ تحديث</a>
          </div>
        )}
      </div>

      {/* ── Dashboard grid ──────────────────────────────────────────── */}
      <main style={{ padding: '28px 28px 72px', maxWidth: '1360px', margin: '0 auto' }}>

        {/* Loading skeleton */}
        {!d && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--owner-muted)' }}>
            <span className="spinner" style={{ borderTopColor: 'var(--owner-gold)', borderColor: 'rgba(200,151,43,0.25)' }} />
            &nbsp; جارٍ تحميل بيانات المدرسة...
          </div>
        )}

        {d && (
          <div className="owner-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

            {/* ── 💰 Finance — widest hero card ──────────────────── */}
            <SectionCard title="الماليات" icon="💰" accent="#f59e0b" wide>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', marginBottom: '20px' }}>
                <Stat
                  label="إجمالي المحصّل"
                  value={<Counter value={d.finance.totalCollected} run={statsReady} format={fmtMoney} />}
                  accent="#22c55e"
                />
                <Stat
                  label="إجمالي المصروفات"
                  value={<Counter value={d.finance.totalExpenses} run={statsReady} format={fmtMoney} />}
                  accent="#f87171"
                />
                <Stat
                  label="صافي الرصيد"
                  value={<Counter value={d.finance.netBalance} run={statsReady} format={fmtMoney} />}
                  accent={d.finance.netBalance >= 0 ? '#a3e635' : '#f87171'}
                />
                <Stat
                  label="نسبة التحصيل"
                  value={<><Counter value={d.finance.collectionRate} run={statsReady} />%</>}
                  sub={`${fmtNum(d.finance.outstanding)} ج.م متبقي`}
                  accent="#e5b850"
                />
              </div>
              {/* collection rate bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--owner-muted)', marginBottom: '6px' }}>
                  <span>نسبة تحصيل الرسوم</span>
                  <span style={{ color: 'var(--owner-gold)', fontWeight: 800 }}>{d.finance.collectionRate}%</span>
                </div>
                <div style={{ height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div className="owner-bar-fill" style={{
                    width: `${d.finance.collectionRate}%`,
                    background: 'linear-gradient(90deg, var(--owner-gold-d), var(--owner-gold-l))',
                  }} />
                </div>
              </div>
            </SectionCard>

            {/* ── 🎓 Students ────────────────────────────────────── */}
            <SectionCard title="الطلاب" icon="🎓" accent="#818cf8">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '18px' }}>
                <Stat label="إجمالي الطلاب" value={<Counter value={d.students.total} run={statsReady} />} />
                <Stat label="نشطون" value={<Counter value={d.students.active} run={statsReady} />} accent="#22c55e" />
                <Stat
                  label="منضمون هذا الشهر"
                  value={<Counter value={d.students.newThisMonth} run={statsReady} />}
                  accent={d.students.newThisMonth > 0 ? '#e5b850' : 'var(--owner-muted)'}
                  sub="طالب جديد"
                />
              </div>
              {d.students.gradeBreakdown.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--owner-muted)', marginBottom: '8px', fontWeight: 700 }}>توزيع حسب الفرقة</div>
                  {d.students.gradeBreakdown.slice(0, 6).map(g => (
                    <Bar key={g.gradeAr} label={g.gradeAr} count={g.count} max={d.students.active} color="#818cf8" />
                  ))}
                  {d.students.gradeBreakdown.length > 6 && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--owner-muted)', marginTop: '4px' }}>
                      +{d.students.gradeBreakdown.length - 6} فرق أخرى
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── 🚌 Buses ───────────────────────────────────────── */}
            <SectionCard title="الباصات" icon="🚌" accent="#38bdf8">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                <Stat label="عدد الباصات" value={<Counter value={d.buses.totalBuses} run={statsReady} />} />
                <Stat label="ركاب نشطون" value={<Counter value={d.buses.totalRiders} run={statsReady} />} accent="#38bdf8" />
                <Stat
                  label="إشغال الطاقة"
                  value={<><Counter value={d.buses.utilization} run={statsReady} />%</>}
                  sub={`من ${fmtNum(d.buses.totalCapacity)} مقعد`}
                  accent={d.buses.utilization > 85 ? '#f87171' : '#34d399'}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {d.buses.byStatus.active   > 0 && <Pill text={`${d.buses.byStatus.active} شغّال`}   color="#22c55e" />}
                {d.buses.byStatus.maintenance > 0 && <Pill text={`${d.buses.byStatus.maintenance} صيانة`} color="#f59e0b" />}
                {d.buses.byStatus.inactive > 0 && <Pill text={`${d.buses.byStatus.inactive} متوقف`} color="#f87171" />}
              </div>
            </SectionCard>

            {/* ── 📦 Inventory ───────────────────────────────────── */}
            <SectionCard title="المخازن والكتب واليونيفورم" icon="📦" accent="#a78bfa">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                <Stat label="إجمالي الأصناف" value={<Counter value={d.inventory.totalItems} run={statsReady} />} />
                <Stat
                  label="أصناف منخفضة"
                  value={<Counter value={d.inventory.lowStockCount} run={statsReady} />}
                  accent={d.inventory.lowStockCount > 0 ? '#f87171' : '#22c55e'}
                  sub={d.inventory.lowStockCount > 0 ? 'تحتاج تعبئة' : 'مخزون كافٍ'}
                />
                <Stat label="قيمة المخزون التقديرية" value={<Counter value={d.inventory.estimatedValue} run={statsReady} format={fmtMoney} />} accent="#a78bfa" />
              </div>
              {d.inventory.lowStockCount > 0 && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                  fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  ⚠️ يوجد {d.inventory.lowStockCount} صنف تحت الحد الأدنى — راجع قسم المخازن
                </div>
              )}
            </SectionCard>

            {/* ── 👥 Staff ────────────────────────────────────────── */}
            <SectionCard title="الفريق" icon="👥" accent="#fb923c">
              <div style={{ display: 'flex', gap: '24px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <Stat label="إجمالي الموظفين" value={<Counter value={d.staff.total} run={statsReady} />} />
                <Stat label="نشطون" value={<Counter value={d.staff.active} run={statsReady} />} accent="#22c55e" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {d.staff.byDepartment.map(dep => (
                  <div key={dep.department} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--owner-text)' }}>{dep.icon} {dep.labelAr}</span>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 800, padding: '3px 12px', borderRadius: '999px',
                      background: dep.count > 0 ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.05)',
                      color: dep.count > 0 ? '#fb923c' : 'var(--owner-muted)',
                    }}>{dep.count} موظف</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 📋 Results ──────────────────────────────────────── */}
            <SectionCard title="كونترول النتائج" icon="📋" accent="#34d399">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                <Stat label="إجمالي الفصول" value={<Counter value={d.results.totalSemesters} run={statsReady} />} />
                <Stat label="منشورة للأولياء" value={<Counter value={d.results.published} run={statsReady} />} accent="#34d399" />
                <Stat
                  label="تحت المراجعة"
                  value={<Counter value={d.results.pendingReviews} run={statsReady} />}
                  accent={d.results.pendingReviews > 0 ? '#f59e0b' : '#34d399'}
                />
              </div>
              {d.results.pendingReviews > 0 ? (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: '0.8rem', color: '#fcd34d',
                }}>
                  🕐 يوجد {d.results.pendingReviews} فصل دراسي في انتظار مراجعة الكونترول
                </div>
              ) : (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
                  fontSize: '0.8rem', color: '#6ee7b7',
                }}>
                  ✅ كل النتائج تمت مراجعتها — لا توجد فصول معلقة
                </div>
              )}
            </SectionCard>

          </div>
        )}
      </main>
    </div>
  )
}
