'use client'
import { useState, useEffect } from 'react'

interface ExamItem {
  id: number; titleAr: string; titleEn: string
  gradeAr: string; gradeEn: string
  subjectAr: string; subjectEn: string
  examDate: string; startTime: string | null; location: string | null
}

export default function SchedulePage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [schedule, setSchedule] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<ExamItem | null>(null)

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(d => { setSchedule(d.schedule ?? []); setLoading(false) })
  }, [])

  const filtered = schedule.filter(s =>
    filter === '' ||
    (lang === 'ar' ? s.gradeAr : s.gradeEn).toLowerCase().includes(filter.toLowerCase())
  )

  // Group by date
  const grouped = filtered.reduce((acc, item) => {
    const d = item.examDate
    if (!acc[d]) acc[d] = []
    acc[d].push(item)
    return acc
  }, {} as Record<string, ExamItem[]>)

  const L = lang === 'ar' ? {
    title: 'جدول الامتحانات', filter: 'فلترة بالصف', all: 'كل الصفوف',
    subject: 'المادة', grade: 'الصف', time: 'الوقت', location: 'القاعة',
    empty: 'لا يوجد جدول امتحانات حالياً', home: 'الرئيسية', lang: 'English',
  } : {
    title: 'Exam Schedule', filter: 'Filter by Grade', all: 'All Grades',
    subject: 'Subject', grade: 'Grade', time: 'Time', location: 'Room',
    empty: 'No exam schedule available yet', home: 'Home', lang: 'عربي',
  }

  const grades = Array.from(new Set(schedule.map(s => lang === 'ar' ? s.gradeAr : s.gradeEn)))

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav style={{ background: '#0a5c36', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>AEA</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>{L.home}</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>🌐 {L.lang}</button>
        </div>
      </nav>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '28px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '4px' }}>{lang === 'ar' ? selected.subjectAr : selected.subjectEn}</div>
                  <div style={{ opacity: 0.7, fontSize: '0.88rem' }}>{lang === 'ar' ? selected.titleAr : selected.titleEn}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '28px' }}>
              {[
                { icon: '🎓', label: lang === 'ar' ? 'الصف' : 'Grade', value: lang === 'ar' ? selected.gradeAr : selected.gradeEn },
                { icon: '📅', label: lang === 'ar' ? 'تاريخ الامتحان' : 'Exam Date', value: new Date(selected.examDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { icon: '🕐', label: lang === 'ar' ? 'وقت البداية' : 'Start Time', value: selected.startTime ?? (lang === 'ar' ? 'غير محدد' : 'Not specified') },
                { icon: '📍', label: lang === 'ar' ? 'القاعة' : 'Room', value: selected.location ?? (lang === 'ar' ? 'غير محدد' : 'Not specified') },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '1.4rem', width: '32px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 28px', background: '#0a5c36', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, margin: '0 0 8px' }}>📅 {L.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.9rem' }}>
          {isRtl ? 'انقر على أي امتحان لرؤية التفاصيل' : 'Click any exam to see full details'}
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <select value={filter} onChange={e => setFilter(e.target.value === L.all ? '' : e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', minWidth: '200px' }}>
            <option value="">{L.all}</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            {L.empty}
          </div>
        ) : (
          Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, items]) => (
            <div key={date} style={{ marginBottom: '24px' }}>
              <div style={{ background: '#0a5c36', color: 'white', padding: '10px 20px', borderRadius: '10px 10px 0 0', fontWeight: 700 }}>
                📆 {new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                {items.map((item, i) => (
                  <div key={item.id} onClick={() => setSelected(item)} style={{
                    padding: '16px 20px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'white'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{lang === 'ar' ? item.subjectAr : item.subjectEn}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{lang === 'ar' ? item.titleAr : item.titleEn}</div>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.9rem' }}>{lang === 'ar' ? item.gradeAr : item.gradeEn}</div>
                    <div style={{ color: '#475569', fontSize: '0.9rem' }}>{item.startTime ?? '—'}</div>
                    <div style={{ color: '#475569', fontSize: '0.9rem' }}>{item.location ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
