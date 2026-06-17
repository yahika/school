'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ════════════════════════════════════════════════════════════════════════════
// OWNER PORTAL — premium executive dashboard.
// Dark luxury aesthetic, animated gold numbers, monthly revenue chart.
// Owner sees the school as a business: revenue, profit, margins, assets.
// ════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────
interface MonthData  { label: string; labelAr: string; revenue: number; expenses: number; profit: number }
interface Analytics  {
  generatedAt: string
  monthly: MonthData[]
  totals: { revenue: number; expenses: number; netProfit: number; profitMargin: number; costPerStudent: number; collectionRate: number }
  expenseBreakdown: { category: string; total: number }[]
  assets: { inventoryValue: number; busFleetValue: number; totalAssets: number; activeBuses: number }
  healthScore: number
}
interface Overview {
  generatedAt: string
  students: { total: number; active: number; newThisMonth: number }
  buses: { totalBuses: number; totalRiders: number; utilization: number; byStatus: Record<string, number> }
  finance: { totalCollected: number; totalExpected: number; totalExpenses: number; netBalance: number; outstanding: number; collectionRate: number }
  inventory: { totalItems: number; lowStockCount: number; estimatedValue: number }
  staff: { total: number; active: number }
  results: { totalSemesters: number; published: number; pendingReviews: number }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number)      { return Math.round(n).toLocaleString('en-US') }
function fmtM(n: number)     { return `${fmt(n)} ج.م` }
function timeGreeting()      { const h = new Date().getHours(); return h < 12 ? 'صباح الخير' : 'مساء الخير' }
function todayLabel()        { return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ value, run, fmt: fmtFn }: { value: number; run: boolean; fmt?: (n: number) => string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) { setN(value); return }
    let raf = 0
    const start = performance.now(); const dur = 1400
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 4)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, run])
  return <>{fmtFn ? fmtFn(n) : fmt(n)}</>
}

// ── Cinematic intro ──────────────────────────────────────────────────────────
function IntroOverlay({ name, onDone }: { name: string; onDone: () => void }) {
  const [s, setS] = useState(0); const [closing, setClosing] = useState(false)
  useEffect(() => {
    const t = [
      setTimeout(() => setS(1), 300),
      setTimeout(() => setS(2), 1000),
      setTimeout(() => setS(3), 1600),
      setTimeout(() => setS(4), 2300),
      setTimeout(() => setS(5), 3100),
    ]
    return () => t.forEach(clearTimeout)
  }, [])
  function finish() {
    if (closing) return
    setClosing(true)
    setTimeout(onDone, 500)
  }
  return (
    <div onClick={finish} style={{
      position:'fixed',inset:0,zIndex:300,cursor:'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      background:'radial-gradient(circle at 50% 40%, #0c1e40 0%, #04091a 65%, #020509 100%)',
      opacity:closing?0:1,transition:'opacity 0.5s ease',textAlign:'center',padding:'24px',overflow:'hidden',
    }}>
      <div className="ow-grid-veil"/>
      <div className="ow-glow-orb"/>
      {/* crest */}
      <div style={{
        width:'96px',height:'96px',borderRadius:'50%',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:'2.5rem',marginBottom:'28px',position:'relative',
        background:'linear-gradient(135deg,#1a2d54,#0a1428)',
        border:'1px solid rgba(212,168,55,0.5)',
        opacity:s>=1?1:0,transform:s>=1?'scale(1)':'scale(0.5)',
        transition:'opacity 0.7s cubic-bezier(.2,.8,.2,1),transform 0.7s cubic-bezier(.2,.8,.2,1)',
        boxShadow:s>=1?'0 0 0 1px rgba(212,168,55,0.2),0 0 60px rgba(212,168,55,0.4)':'none',
      }}>
        <span className={s>=1?'ow-crest-pulse':''}>👑</span>
      </div>
      {/* gold divider */}
      <div style={{width:'220px',height:'2px',marginBottom:'24px',background:'rgba(255,255,255,0.07)',position:'relative',overflow:'hidden',borderRadius:'2px'}}>
        <div style={{position:'absolute',inset:'0 auto 0 0',height:'100%',background:'linear-gradient(90deg,#8a6210,#d4a837,#f0cc60,#d4a837,#8a6210)',width:s>=2?'100%':'0%',transition:'width 1s cubic-bezier(.2,.8,.2,1)'}}/>
      </div>
      {/* headline */}
      <div style={{fontSize:'clamp(1.5rem,5vw,2.6rem)',fontWeight:900,color:'white',letterSpacing:'0.01em',marginBottom:'12px',opacity:s>=3?1:0,transform:s>=3?'translateY(0)':'translateY(16px)',transition:'opacity 0.7s ease,transform 0.7s ease'}}>
        {timeGreeting()} يا أستاذ <span style={{color:'#d4a837'}}>{name||'صاحب المدرسة'}</span>
      </div>
      {/* sub */}
      <div style={{fontSize:'0.95rem',color:'rgba(255,255,255,0.5)',maxWidth:'460px',lineHeight:1.9,opacity:s>=4?1:0,transform:s>=4?'translateY(0)':'translateY(10px)',transition:'opacity 0.7s ease 0.1s,transform 0.7s ease 0.1s'}}>
        إمبراطوريتك التعليمية — أرباح، إيرادات، أصول، وكل ما يجري في مدرستك في لحظة واحدة.
      </div>
      {/* cta */}
      <button onClick={e=>{e.stopPropagation();finish()}} style={{
        marginTop:'38px',padding:'13px 40px',borderRadius:'999px',fontFamily:'inherit',
        background:'linear-gradient(135deg,#d4a837,#a07820)',color:'#100d02',border:'none',
        fontWeight:900,fontSize:'0.95rem',cursor:'pointer',letterSpacing:'0.04em',
        boxShadow:'0 12px 40px rgba(212,168,55,0.4)',
        opacity:s>=5?1:0,transform:s>=5?'translateY(0) scale(1)':'translateY(12px) scale(0.96)',
        transition:'opacity 0.5s ease,transform 0.5s ease',pointerEvents:s>=5?'auto':'none',
      }}>
        عرض الإمبراطورية ←
      </button>
      <div style={{position:'absolute',bottom:'24px',fontSize:'0.73rem',color:'rgba(255,255,255,0.25)',opacity:s>=5?1:0,transition:'opacity 0.6s ease'}}>
        اضغط في أي مكان للمتابعة
      </div>
    </div>
  )
}

// ── Revenue bar chart (SVG, 6 months) ────────────────────────────────────────
function RevenueChart({ data, run }: { data: MonthData[]; run: boolean }) {
  const maxVal = Math.max(...data.map(m => Math.max(m.revenue, m.expenses)), 1)
  const H = 100; const barW = 24; const gap = 12
  const totalW = data.length * (barW * 2 + gap + 10)

  return (
    <div style={{overflowX:'auto',paddingBottom:'4px'}}>
      <svg width={totalW} height={H + 32} style={{display:'block',minWidth:'100%'}}>
        {data.map((m, i) => {
          const x = i * (barW * 2 + gap + 10) + 4
          const rH = run ? Math.round((m.revenue / maxVal) * H) : 0
          const eH = run ? Math.round((m.expenses / maxVal) * H) : 0
          return (
            <g key={m.label}>
              {/* revenue bar */}
              <rect x={x} y={H - rH} width={barW} height={rH} rx={4}
                fill="url(#barGold)"
                style={{transition:'height 1.2s cubic-bezier(.2,.8,.2,1),y 1.2s cubic-bezier(.2,.8,.2,1)'}}
              />
              {/* expenses bar */}
              <rect x={x + barW + 4} y={H - eH} width={barW} height={eH} rx={4}
                fill="url(#barRed)"
                style={{transition:'height 1.2s cubic-bezier(.2,.8,.2,1),y 1.2s cubic-bezier(.2,.8,.2,1)'}}
              />
              {/* month label */}
              <text x={x + barW} y={H + 18} textAnchor="middle" fontSize="10" fill="rgba(238,242,255,0.5)"
                fontFamily="Tajawal, sans-serif">
                {m.labelAr}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0cc60"/>
            <stop offset="100%" stopColor="#a07820"/>
          </linearGradient>
          <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171"/>
            <stop offset="100%" stopColor="#b91c1c"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{display:'flex',gap:'16px',marginTop:'2px',fontSize:'0.7rem',color:'rgba(238,242,255,0.45)'}}>
        <span><span style={{display:'inline-block',width:'10px',height:'10px',borderRadius:'2px',background:'#d4a837',marginInlineEnd:'4px',verticalAlign:'middle'}}/>إيرادات</span>
        <span><span style={{display:'inline-block',width:'10px',height:'10px',borderRadius:'2px',background:'#f87171',marginInlineEnd:'4px',verticalAlign:'middle'}}/>مصروفات</span>
      </div>
    </div>
  )
}

// ── Health score ring ─────────────────────────────────────────────────────────
function HealthRing({ score, run }: { score: number; run: boolean }) {
  const r = 42; const circ = 2 * Math.PI * r
  const offset = run ? circ * (1 - score / 100) : circ
  const color  = score >= 80 ? '#22c55e' : score >= 60 ? '#d4a837' : '#f87171'
  const label  = score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : 'يحتاج انتباه'
  return (
    <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
      <svg width={100} height={100} style={{flexShrink:0}}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{transition:'stroke-dashoffset 1.5s cubic-bezier(.2,.8,.2,1)'}}
        />
        <text x={50} y={46} textAnchor="middle" fontSize="18" fontWeight="900" fill={color} fontFamily="Tajawal, sans-serif">
          {run ? score : 0}
        </text>
        <text x={50} y={62} textAnchor="middle" fontSize="9" fill="rgba(238,242,255,0.4)" fontFamily="Tajawal, sans-serif">
          /100
        </text>
      </svg>
      <div>
        <div style={{fontSize:'1.05rem',fontWeight:800,color,marginBottom:'4px'}}>{label}</div>
        <div style={{fontSize:'0.76rem',color:'rgba(238,242,255,0.45)',lineHeight:1.7}}>
          مؤشر صحة الأعمال<br/>
          يقيس: الربح · التحصيل · المخزون
        </div>
      </div>
    </div>
  )
}

// ── KPI hero card ─────────────────────────────────────────────────────────────
function HeroKPI({ label, value, sub, accent, icon }: { label: string; value: React.ReactNode; sub?: string; accent: string; icon: string }) {
  return (
    <div className="ow-kpi-card" style={{borderColor:`${accent}28`}}>
      <div style={{
        width:'44px',height:'44px',borderRadius:'13px',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:'1.25rem',background:`${accent}18`,border:`1px solid ${accent}33`,
        marginBottom:'14px',flexShrink:0,
      }}>{icon}</div>
      <div style={{fontSize:'clamp(1.5rem,3vw,2.1rem)',fontWeight:900,color:accent,lineHeight:1.1,fontVariantNumeric:'tabular-nums',marginBottom:'6px'}}>
        {value}
      </div>
      <div style={{fontSize:'0.84rem',color:'rgba(238,242,255,0.6)',fontWeight:700}}>{label}</div>
      {sub && <div style={{fontSize:'0.72rem',color:'rgba(238,242,255,0.35)',marginTop:'4px'}}>{sub}</div>}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ title, icon, accent, children, wide, tall }: { title: string; icon: string; accent: string; children: React.ReactNode; wide?: boolean; tall?: boolean }) {
  return (
    <div className="ow-card" style={{ gridColumn: wide ? 'span 2' : undefined, gridRow: tall ? 'span 2' : undefined }}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
        <div style={{width:'36px',height:'36px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',background:`${accent}20`,border:`1px solid ${accent}40`}}>{icon}</div>
        <div style={{fontWeight:800,color:'#eef2ff',fontSize:'0.95rem',letterSpacing:'0.01em'}}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div style={{flex:'1 1 120px',minWidth:0}}>
      <div style={{fontSize:'1.65rem',fontWeight:900,color:accent??'#eef2ff',lineHeight:1.15,fontVariantNumeric:'tabular-nums'}}>{value}</div>
      <div style={{fontSize:'0.76rem',color:'rgba(238,242,255,0.48)',marginTop:'3px'}}>{label}{sub?<span style={{color:'rgba(238,242,255,0.28)'}}> · {sub}</span>:null}</div>
    </div>
  )
}

function Bar({ label, count, max, color, prefix }: { label: string; count: number; max: number; color: string; prefix?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.76rem',color:'rgba(238,242,255,0.55)',marginBottom:'4px'}}>
        <span>{label}</span>
        <span style={{fontWeight:800,color:'#eef2ff'}}>{prefix??''}{fmt(count)}</span>
      </div>
      <div style={{height:'5px',borderRadius:'4px',background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
        <div className="ow-bar" style={{width:`${pct}%`,background:color}}/>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════════════════════════════════
export default function OwnerPortalPage() {
  const router = useRouter()
  const [me, setMe] = useState<{ name: string } | null>(null)
  const [ov, setOv]  = useState<Overview | null>(null)
  const [an, setAn]  = useState<Analytics | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('owner-intro-seen')) setShowIntro(true)
    Promise.all([
      fetch('/api/staff/me').then(r => r.ok ? r.json() : null),
      fetch('/api/staff/owner/overview').then(r => r.ok ? r.json() : null),
      fetch('/api/staff/owner/analytics').then(r => r.ok ? r.json() : null),
    ]).then(([m, o, a]) => { setMe(m); setOv(o); setAn(a) })
  }, [])

  function handleIntroDone() {
    sessionStorage.setItem('owner-intro-seen', '1')
    setShowIntro(false)
    setTimeout(() => setReady(true), 150)
  }
  useEffect(() => { if (!showIntro && ov && an) setReady(true) }, [showIntro, ov, an])

  async function logout() {
    await fetch('/api/staff/logout', { method: 'POST' })
    router.push('/staff/login')
  }

  const ownerName = me?.name ?? ''

  return (
    <div dir="rtl" style={{minHeight:'100vh',fontFamily:'Tajawal, sans-serif',background:'var(--ow-bg)'}}>

      {/* ── Injected styles ──────────────────────────────────────────────── */}
      <style>{`
        :root {
          --ow-bg:      #060b16;
          --ow-surf:    #0b1221;
          --ow-surf2:   #0f1929;
          --ow-border:  rgba(212,168,55,0.14);
          --ow-gold:    #d4a837;
          --ow-goldl:   #f0cc60;
          --ow-goldd:   #a07820;
          --ow-text:    #eef2ff;
          --ow-muted:   rgba(238,242,255,0.42);
        }
        @keyframes owFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes owPulse  { 0%,100%{box-shadow:0 0 20px rgba(212,168,55,0.12)} 50%{box-shadow:0 0 48px rgba(212,168,55,0.3)} }
        @keyframes owCrest  { 0%,100%{filter:drop-shadow(0 0 6px rgba(212,168,55,0.35))} 50%{filter:drop-shadow(0 0 20px rgba(240,204,96,0.9))} }
        @keyframes owGrid   { 0%{background-position:0 0} 100%{background-position:40px 40px} }
        @keyframes owBarIn  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes owGlow   { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .ow-grid-veil {
          position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(rgba(212,168,55,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,55,0.03) 1px,transparent 1px);
          background-size:44px 44px;animation:owGrid 9s linear infinite;
        }
        .ow-glow-orb {
          position:absolute;top:28%;left:50%;transform:translate(-50%,-50%);
          width:560px;height:560px;border-radius:50%;
          background:radial-gradient(circle,rgba(212,168,55,0.07) 0%,transparent 70%);
          pointer-events:none;z-index:0;
        }
        .ow-crest-pulse { animation:owCrest 2.8s ease-in-out infinite; }
        .ow-card {
          background:var(--ow-surf);
          border:1px solid var(--ow-border);
          border-radius:18px;padding:22px 24px;
          animation:owFadeUp 0.55s ease both;
          transition:border-color 0.2s,box-shadow 0.2s;
        }
        .ow-card:hover { border-color:rgba(212,168,55,0.3); box-shadow:0 6px 32px rgba(212,168,55,0.07); }
        .ow-kpi-card {
          background:linear-gradient(135deg,var(--ow-surf) 0%,var(--ow-surf2) 100%);
          border:1px solid var(--ow-border);
          border-radius:18px;padding:22px 22px 18px;
          display:flex;flex-direction:column;
          animation:owFadeUp 0.55s ease both;
          transition:border-color 0.22s,box-shadow 0.22s,transform 0.18s;
          position:relative;overflow:hidden;
        }
        .ow-kpi-card::before {
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--ow-gold),transparent);
          opacity:0;transition:opacity 0.2s;
        }
        .ow-kpi-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
        .ow-kpi-card:hover::before { opacity:1; }
        .ow-bar { height:100%;border-radius:4px;transform-origin:left;animation:owBarIn 1.1s cubic-bezier(.2,.8,.2,1) both; }
        .ow-hero-border {
          position:relative;
          background:linear-gradient(135deg,#0c1a35 0%,#0d2042 50%,#0c1a35 100%);
          border-bottom:1px solid var(--ow-border);
          padding:32px 36px;
          overflow:hidden;
        }
        .ow-hero-border::before {
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 70% 50%,rgba(212,168,55,0.06) 0%,transparent 65%);
          pointer-events:none;
        }
        .ow-two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .ow-four-col { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media(max-width:1100px) { .ow-four-col { grid-template-columns:1fr 1fr; } }
        @media(max-width:720px)  { .ow-two-col { grid-template-columns:1fr !important; } .ow-four-col { grid-template-columns:1fr !important; } .ow-card[style*="span 2"],.ow-kpi-card[style*="span 2"] { grid-column:span 1!important; } }
      `}</style>

      {/* ── Intro overlay ───────────────────────────────────────────────── */}
      {showIntro && <IntroOverlay name={ownerName} onDone={handleIntroDone}/>}

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <header style={{
        background:'linear-gradient(135deg,#080f1e 0%,#0c1630 100%)',
        borderBottom:'1px solid var(--ow-border)',
        padding:'13px 28px',display:'flex',alignItems:'center',gap:'14px',
        position:'sticky',top:0,zIndex:100,
        boxShadow:'0 4px 36px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width:'46px',height:'46px',borderRadius:'13px',flexShrink:0,
          background:'linear-gradient(135deg,#d4a837,#a07820)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'1.35rem',boxShadow:'0 4px 18px rgba(212,168,55,0.4)',
        }}>👑</div>
        <div>
          <div style={{color:'var(--ow-goldl)',fontWeight:900,fontSize:'1.05rem',letterSpacing:'0.03em'}}>
            بوابة صاحب المدرسة
          </div>
          <div style={{color:'var(--ow-muted)',fontSize:'0.71rem',marginTop:'1px'}}>أكاديمية النخبة بالإسكندرية · النظرة الشاملة</div>
        </div>
        <div style={{marginInlineStart:'auto',display:'flex',alignItems:'center',gap:'18px'}}>
          {ov && (
            <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.72rem',color:'var(--ow-muted)'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e',display:'inline-block'}}/>
              محدّث للتو
            </div>
          )}
          {me && (
            <div style={{textAlign:'end'}}>
              <div style={{color:'var(--ow-text)',fontWeight:700,fontSize:'0.88rem'}}>{me.name}</div>
              <div style={{color:'var(--ow-muted)',fontSize:'0.7rem'}}>صاحب المدرسة</div>
            </div>
          )}
          <button onClick={logout} style={{
            background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
            color:'rgba(255,255,255,0.55)',borderRadius:'10px',padding:'8px 18px',
            cursor:'pointer',fontFamily:'inherit',fontSize:'0.82rem',fontWeight:600,
            transition:'background 0.15s',
          }}>خروج 🚪</button>
        </div>
      </header>

      {/* ── Hero greeting ────────────────────────────────────────────────── */}
      <div className="ow-hero-border">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',position:'relative',zIndex:1}}>
          <div>
            <div style={{fontSize:'clamp(1.3rem,3.5vw,2rem)',fontWeight:900,color:'var(--ow-text)',marginBottom:'6px'}}>
              {timeGreeting()} يا أستاذ <span style={{color:'var(--ow-goldl)'}}>{ownerName||'...'}</span> 👑
            </div>
            <div style={{color:'var(--ow-muted)',fontSize:'0.86rem'}}>{todayLabel()}</div>
          </div>
          {an && (
            <div style={{
              background:'rgba(212,168,55,0.08)',border:'1px solid rgba(212,168,55,0.22)',
              borderRadius:'14px',padding:'12px 20px',textAlign:'center',
            }}>
              <div style={{fontSize:'0.7rem',color:'var(--ow-muted)',marginBottom:'4px',letterSpacing:'0.08em'}}>مؤشر صحة الأعمال</div>
              <div style={{fontSize:'2rem',fontWeight:900,color: an.healthScore>=80?'#22c55e':an.healthScore>=60?'#d4a837':'#f87171',lineHeight:1}}>
                {ready ? an.healthScore : 0}<span style={{fontSize:'0.9rem',opacity:0.5}}>/100</span>
              </div>
              <div style={{fontSize:'0.72rem',color:an.healthScore>=80?'#22c55e':an.healthScore>=60?'#d4a837':'#f87171',marginTop:'3px'}}>
                {an.healthScore>=80?'ممتاز ✨':an.healthScore>=60?'جيد 👍':'يحتاج انتباه ⚠️'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{padding:'26px 26px 88px',maxWidth:'1400px',margin:'0 auto'}}>

        {(!ov || !an) && (
          <div style={{textAlign:'center',padding:'100px 20px',color:'var(--ow-muted)'}}>
            <div style={{fontSize:'2rem',marginBottom:'12px'}}>⌛</div>
            جارٍ تحميل بيانات الإمبراطورية...
          </div>
        )}

        {ov && an && (
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

            {/* ── Row 1: 4 hero KPIs ─────────────────────────────────── */}
            <div className="ow-four-col">
              <HeroKPI icon="💰" label="إجمالي الإيرادات المحصّلة" accent="#d4a837"
                value={<Counter value={an.totals.revenue} run={ready} fmt={fmtM}/>}
                sub={`${an.totals.collectionRate}% نسبة التحصيل`}
              />
              <HeroKPI icon="📈" label="صافي الربح" accent={an.totals.netProfit>=0?'#22c55e':'#f87171'}
                value={<Counter value={an.totals.netProfit} run={ready} fmt={fmtM}/>}
                sub={`هامش الربح ${an.totals.profitMargin}%`}
              />
              <HeroKPI icon="🏗️" label="إجمالي الأصول التقديرية" accent="#a78bfa"
                value={<Counter value={an.assets.totalAssets} run={ready} fmt={fmtM}/>}
                sub={`${an.assets.activeBuses} باص نشط · مخزون`}
              />
              <HeroKPI icon="🎓" label="التكلفة لكل طالب (تشغيل)" accent="#38bdf8"
                value={<Counter value={an.totals.costPerStudent} run={ready} fmt={fmtM}/>}
                sub={`${ov.students.active} طالب نشط`}
              />
            </div>

            {/* ── Row 2: Revenue chart (wide) + Health ring ──────────── */}
            <div className="ow-two-col">
              <div className="ow-card" style={{gridColumn:'span 1'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',background:'rgba(212,168,55,0.15)',border:'1px solid rgba(212,168,55,0.3)'}}>📊</div>
                  <div style={{fontWeight:800,color:'#eef2ff',fontSize:'0.95rem'}}>الإيرادات والمصروفات — آخر 6 أشهر</div>
                </div>
                <RevenueChart data={an.monthly} run={ready}/>
                {/* profit row */}
                <div style={{marginTop:'16px',display:'flex',gap:'16px',flexWrap:'wrap'}}>
                  {an.monthly.slice(-3).map(m => (
                    <div key={m.label} style={{flex:'1 1 80px',background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'10px 12px',border:'1px solid rgba(255,255,255,0.06)'}}>
                      <div style={{fontSize:'0.68rem',color:'rgba(238,242,255,0.38)',marginBottom:'4px'}}>{m.labelAr}</div>
                      <div style={{fontSize:'0.9rem',fontWeight:800,color:m.profit>=0?'#4ade80':'#f87171'}}>
                        {m.profit>=0?'+':''}{fmtM(m.profit)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health score + detailed metrics */}
              <div className="ow-card">
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)'}}>🏅</div>
                  <div style={{fontWeight:800,color:'#eef2ff',fontSize:'0.95rem'}}>الصحة المالية للمدرسة</div>
                </div>
                <HealthRing score={an.healthScore} run={ready}/>
                <div style={{marginTop:'20px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:'0.82rem',color:'rgba(238,242,255,0.6)'}}>هامش الربح الصافي</span>
                    <span style={{fontWeight:800,fontSize:'0.9rem',color:an.totals.profitMargin>=20?'#22c55e':'#f59e0b'}}>{an.totals.profitMargin}%</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:'0.82rem',color:'rgba(238,242,255,0.6)'}}>نسبة تحصيل الرسوم</span>
                    <span style={{fontWeight:800,fontSize:'0.9rem',color:an.totals.collectionRate>=80?'#22c55e':'#f87171'}}>{an.totals.collectionRate}%</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:'0.82rem',color:'rgba(238,242,255,0.6)'}}>أصناف مخزون تحت الحد</span>
                    <span style={{fontWeight:800,fontSize:'0.9rem',color:ov.inventory.lowStockCount>0?'#f87171':'#22c55e'}}>{ov.inventory.lowStockCount} صنف</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:'0.82rem',color:'rgba(238,242,255,0.6)'}}>الرسوم غير المسددة</span>
                    <span style={{fontWeight:800,fontSize:'0.9rem',color:'#f59e0b'}}>{fmtM(ov.finance.outstanding)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 3: Expense breakdown + Finance summary ─────────── */}
            <div className="ow-two-col">
              <Card title="توزيع المصروفات" icon="💸" accent="#fb923c">
                {an.expenseBreakdown.map(e => (
                  <Bar key={e.category} label={e.category} count={e.total}
                    max={an.totals.expenses} color="#fb923c" prefix=""/>
                ))}
                <div style={{marginTop:'14px',paddingTop:'14px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',fontSize:'0.82rem'}}>
                  <span style={{color:'rgba(238,242,255,0.5)'}}>إجمالي المصروفات</span>
                  <span style={{fontWeight:800,color:'#fb923c'}}>{fmtM(an.totals.expenses)}</span>
                </div>
              </Card>

              <Card title="لقطة مالية" icon="💎" accent="#d4a837">
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'18px'}}>
                  {[
                    {label:'إجمالي الرسوم المتوقعة', value:ov.finance.totalExpected, color:'rgba(238,242,255,0.7)'},
                    {label:'تم تحصيله', value:ov.finance.totalCollected, color:'#22c55e'},
                    {label:'المتبقي', value:ov.finance.outstanding, color:'#f59e0b'},
                    {label:'إجمالي المصروفات', value:an.totals.expenses, color:'#f87171'},
                    {label:'صافي الرصيد', value:ov.finance.netBalance, color:ov.finance.netBalance>=0?'#4ade80':'#f87171'},
                  ].map(row => (
                    <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                      <span style={{fontSize:'0.82rem',color:'rgba(238,242,255,0.55)'}}>{row.label}</span>
                      <span style={{fontWeight:900,fontSize:'0.9rem',color:row.color}}>{fmtM(row.value)}</span>
                    </div>
                  ))}
                </div>
                {/* collection bar */}
                <div style={{marginTop:'4px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'rgba(238,242,255,0.45)',marginBottom:'6px'}}>
                    <span>نسبة التحصيل</span>
                    <span style={{color:'var(--ow-gold)',fontWeight:800}}>{an.totals.collectionRate}%</span>
                  </div>
                  <div style={{height:'8px',borderRadius:'6px',background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
                    <div className="ow-bar" style={{width:`${an.totals.collectionRate}%`,background:'linear-gradient(90deg,var(--ow-goldd),var(--ow-goldl))'}}/>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Row 4: Students / Buses / Staff / Assets ──────────── */}
            <div className="ow-four-col">
              <Card title="الطلاب" icon="🎓" accent="#818cf8">
                <Stat label="إجمالي الطلاب" value={<Counter value={ov.students.total} run={ready}/>}/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="نشطون" value={<Counter value={ov.students.active} run={ready}/>} accent="#22c55e"/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="جُدد هذا الشهر" value={<Counter value={ov.students.newThisMonth} run={ready}/>} accent="#d4a837"/>
              </Card>
              <Card title="الباصات" icon="🚌" accent="#38bdf8">
                <Stat label="عدد الباصات" value={<Counter value={ov.buses.totalBuses} run={ready}/>}/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="ركاب نشطون" value={<Counter value={ov.buses.totalRiders} run={ready}/>} accent="#38bdf8"/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="إشغال الطاقة" value={<><Counter value={ov.buses.utilization} run={ready}/>%</>} accent={ov.buses.utilization>85?'#f87171':'#34d399'}/>
                {ov.buses.byStatus.maintenance>0 && (
                  <div style={{marginTop:'12px',fontSize:'0.75rem',color:'#fcd34d',background:'rgba(245,158,11,0.1)',borderRadius:'8px',padding:'7px 10px',border:'1px solid rgba(245,158,11,0.2)'}}>
                    ⚠️ {ov.buses.byStatus.maintenance} باص في الصيانة
                  </div>
                )}
              </Card>
              <Card title="الفريق" icon="👥" accent="#fb923c">
                <Stat label="إجمالي الموظفين" value={<Counter value={ov.staff.total} run={ready}/>}/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="نشطون" value={<Counter value={ov.staff.active} run={ready}/>} accent="#22c55e"/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="المرتبات الشهرية" value={fmtM(an.expenseBreakdown.find(e=>e.category==='رواتب')?.total ?? 0)} accent="#fb923c"/>
              </Card>
              <Card title="الأصول" icon="🏗️" accent="#a78bfa">
                <Stat label="قيمة المخزون" value={<Counter value={an.assets.inventoryValue} run={ready} fmt={fmtM}/>} accent="#a78bfa"/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="أسطول الباصات (تقديري)" value={<Counter value={an.assets.busFleetValue} run={ready} fmt={fmtM}/>} accent="#c084fc"/>
                <div style={{marginTop:'12px'}}/>
                <Stat label="إجمالي الأصول" value={<Counter value={an.assets.totalAssets} run={ready} fmt={fmtM}/>} accent="#e879f9"/>
              </Card>
            </div>

            {/* ── Row 5: Results + Inventory alerts ────────────────── */}
            <div className="ow-two-col">
              <Card title="كونترول النتائج" icon="📋" accent="#34d399">
                <div style={{display:'flex',gap:'20px',flexWrap:'wrap',marginBottom:'14px'}}>
                  <Stat label="فصول دراسية" value={<Counter value={ov.results.totalSemesters} run={ready}/>}/>
                  <Stat label="منشورة للأولياء" value={<Counter value={ov.results.published} run={ready}/>} accent="#34d399"/>
                  <Stat label="قيد المراجعة" value={<Counter value={ov.results.pendingReviews} run={ready}/>} accent={ov.results.pendingReviews>0?'#f59e0b':'#34d399'}/>
                </div>
                {ov.results.pendingReviews>0
                  ? <div style={{padding:'10px 14px',borderRadius:'10px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',fontSize:'0.8rem',color:'#fcd34d'}}>
                      🕐 {ov.results.pendingReviews} فصل دراسي في انتظار مراجعة الكونترول
                    </div>
                  : <div style={{padding:'10px 14px',borderRadius:'10px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.15)',fontSize:'0.8rem',color:'#6ee7b7'}}>
                      ✅ كل النتائج تمت مراجعتها
                    </div>
                }
              </Card>
              <Card title="المخازن والأصناف" icon="📦" accent="#a78bfa">
                <div style={{display:'flex',gap:'20px',flexWrap:'wrap',marginBottom:'14px'}}>
                  <Stat label="إجمالي الأصناف" value={<Counter value={ov.inventory.totalItems} run={ready}/>}/>
                  <Stat label="منخفضة المخزون" value={<Counter value={ov.inventory.lowStockCount} run={ready}/>} accent={ov.inventory.lowStockCount>0?'#f87171':'#22c55e'}/>
                  <Stat label="قيمة المخزون" value={<Counter value={ov.inventory.estimatedValue} run={ready} fmt={fmtM}/>} accent="#a78bfa"/>
                </div>
                {ov.inventory.lowStockCount>0
                  ? <div style={{padding:'10px 14px',borderRadius:'10px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',fontSize:'0.8rem',color:'#fca5a5',display:'flex',alignItems:'center',gap:'8px'}}>
                      ⚠️ يوجد {ov.inventory.lowStockCount} صنف تحت الحد الأدنى — راجع قسم المخازن
                    </div>
                  : <div style={{padding:'10px 14px',borderRadius:'10px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.15)',fontSize:'0.8rem',color:'#6ee7b7'}}>
                      ✅ مستويات المخزون طبيعية
                    </div>
                }
              </Card>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
