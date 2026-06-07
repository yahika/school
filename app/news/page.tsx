'use client'
import { useState, useEffect } from 'react'

interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; publishedAt: string }

const COLORS = ['#0a5c36','#2563eb','#c8972b','#7c3aed','#dc2626','#0369a1']

export default function NewsPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Announcement | null>(null)

  useEffect(() => {
    fetch('/api/announcements').then(r => r.json()).then(d => { setItems(d.announcements ?? []); setLoading(false) })
  }, [])

  const L = lang === 'ar'
    ? { title: 'أخبار وإعلانات المدرسة', home: 'الرئيسية', lang: 'English', empty: 'لا توجد إعلانات حالياً', read: 'اقرأ المزيد', close: 'إغلاق', published: 'تاريخ النشر' }
    : { title: 'School News & Announcements', home: 'Home', lang: 'عربي', empty: 'No announcements yet', read: 'Read More', close: 'Close', published: 'Published' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
      @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      .ann-card { transition: all 0.2s; }
      .ann-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; cursor: pointer; }
      `}</style>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '24px', maxWidth: '620px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'fadeIn 0.25s ease', overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.25rem', lineHeight: 1.4, margin: 0, flex: 1 }}>
                  {lang === 'ar' ? selected.titleAr : selected.titleEn}
                </h2>
                <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b', flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                📅 {L.published}: {new Date(selected.publishedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              <p style={{ color: '#374151', lineHeight: 2, fontSize: '1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                {lang === 'ar' ? selected.bodyAr : selected.bodyEn}
              </p>
            </div>
            <div style={{ padding: '16px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 28px', background: '#0a5c36', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                {L.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ background: '#0a5c36', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'white' }}>AEA</div>
          <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>{L.home}</a>
        </div>
        <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '5px 14px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          🌐 {L.lang}
        </button>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '56px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, margin: '0 0 8px' }}>📢 {L.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.95rem' }}>
          {isRtl ? 'انقر على أي إعلان لقراءة التفاصيل الكاملة' : 'Click any announcement to read the full details'}
        </p>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', height: '140px', border: '1px solid #e2e8f0', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📭</div>
            <div style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>{L.empty}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, i) => (
              <div key={item.id} className="ann-card" onClick={() => setSelected(item)} style={{
                background: 'white', borderRadius: '20px', padding: '28px 32px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                borderTop: `4px solid ${COLORS[i % COLORS.length]}`,
                animation: `fadeIn 0.4s ease ${i * 0.06}s both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        {new Date(item.publishedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 10px', fontSize: '1.1rem', lineHeight: 1.4 }}>
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {lang === 'ar' ? item.bodyAr : item.bodyEn}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '28px' }}>
                    {L.read} {isRtl ? '←' : '→'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
