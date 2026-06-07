'use client'
import { useState, useEffect } from 'react'

interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; publishedAt: string }

export default function NewsPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/announcements').then(r => r.json()).then(d => { setItems(d.announcements ?? []); setLoading(false) })
  }, [])

  const L = lang === 'ar'
    ? { title: 'أخبار وإعلانات المدرسة', home: 'الرئيسية', lang: 'English', empty: 'لا توجد إعلانات حالياً' }
    : { title: 'School News & Announcements', home: 'Home', lang: 'عربي', empty: 'No announcements yet' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav style={{ background: '#0a5c36', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>AEA</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>{L.home}</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>🌐 {L.lang}</button>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, margin: 0 }}>📢 {L.title}</h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            {L.empty}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {items.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 style={{ color: '#0a5c36', fontWeight: 700, margin: 0, fontSize: '1.15rem' }}>
                    {lang === 'ar' ? item.titleAr : item.titleEn}
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '999px', flexShrink: 0 }}>
                    {new Date(item.publishedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ color: '#475569', lineHeight: 1.8, margin: 0 }}>
                  {lang === 'ar' ? item.bodyAr : item.bodyEn}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
