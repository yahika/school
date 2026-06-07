'use client'
import { useState, useEffect } from 'react'

interface CalEvent { id: number; titleAr: string; titleEn: string; date: string; endDate: string | null; type: string; color: string | null; descriptionAr: string | null; descriptionEn: string | null }

const TYPE_CONFIG: Record<string, { icon: string; color: string; labelAr: string; labelEn: string }> = {
  exam:     { icon: '📝', color: '#dc2626', labelAr: 'امتحان', labelEn: 'Exam' },
  holiday:  { icon: '🌴', color: '#16a34a', labelAr: 'إجازة', labelEn: 'Holiday' },
  event:    { icon: '🎉', color: '#2563eb', labelAr: 'فعالية', labelEn: 'Event' },
  term:     { icon: '📚', color: '#7c3aed', labelAr: 'فصل دراسي', labelEn: 'Term' },
  meeting:  { icon: '👨‍👩‍👧', color: '#c8972b', labelAr: 'اجتماع أولياء', labelEn: 'Parent Meeting' },
}

export default function CalendarPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [filterType, setFilterType] = useState('all')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetch('/api/calendar').then(r => r.json()).then(d => { setEvents(d.events ?? []); setLoading(false) })
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsInMonth = events.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === month && d.getFullYear() === year && (filterType === 'all' || e.type === filterType)
  })

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr || (e.endDate && e.date <= dateStr && e.endDate >= dateStr))
  }

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && (filterType === 'all' || e.type === filterType))
    .slice(0, 8)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      .day-cell:hover { background: #f0fdf4 !important; cursor: pointer; }
      `}</style>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', maxWidth: '460px', width: '100%', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: selected.color ?? TYPE_CONFIG[selected.type]?.color ?? '#0a5c36', padding: '24px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{TYPE_CONFIG[selected.type]?.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.3 }}>{isRtl ? selected.titleAr : selected.titleEn}</div>
                  <div style={{ opacity: 0.75, fontSize: '0.82rem', marginTop: '4px' }}>
                    {TYPE_CONFIG[selected.type]?.[isRtl ? 'labelAr' : 'labelEn']}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{isRtl ? 'التاريخ' : 'Date'}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    {new Date(selected.date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                {selected.endDate && (
                  <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{isRtl ? 'حتى' : 'Until'}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                      {new Date(selected.endDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
              {(isRtl ? selected.descriptionAr : selected.descriptionEn) && (
                <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
                  {isRtl ? selected.descriptionAr : selected.descriptionEn}
                </p>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 24px', background: '#0a5c36', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ background: '#0a5c36', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'white' }}>AEA</div>
          <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>{isRtl ? 'الرئيسية' : 'Home'}</a>
        </div>
        <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '5px 14px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          🌐 {lang === 'ar' ? 'English' : 'عربي'}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, margin: '0 0 8px' }}>
          📅 {isRtl ? 'التقويم المدرسي' : 'School Calendar'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          {isRtl ? 'جميع المواعيد والفعاليات والإجازات في مكان واحد' : 'All dates, events, and holidays in one place'}
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

        {/* Calendar Grid */}
        <div>
          {/* Type filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setFilterType('all')} style={{ padding: '6px 14px', borderRadius: '999px', border: '2px solid', borderColor: filterType === 'all' ? '#0a5c36' : '#e2e8f0', background: filterType === 'all' ? '#0a5c36' : 'white', color: filterType === 'all' ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}>
              {isRtl ? 'الكل' : 'All'}
            </button>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => setFilterType(key)} style={{ padding: '6px 14px', borderRadius: '999px', border: '2px solid', borderColor: filterType === key ? cfg.color : '#e2e8f0', background: filterType === key ? cfg.color : 'white', color: filterType === key ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}>
                {cfg.icon} {isRtl ? cfg.labelAr : cfg.labelEn}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#0a5c36', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}>‹</button>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{monthName}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}>›</button>
            </div>

            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {(isRtl ? ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(d => (
                <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} style={{ padding: '8px', minHeight: '72px', background: '#fafafa', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDay(day)
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
                return (
                  <div key={day} className="day-cell" style={{ padding: '6px 4px', minHeight: '72px', background: isToday ? '#f0fdf4' : 'white', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <div style={{ fontWeight: isToday ? 900 : 500, fontSize: '0.85rem', marginBottom: '4px', width: '24px', height: '24px', borderRadius: '50%', background: isToday ? '#0a5c36' : 'transparent', color: isToday ? 'white' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {day}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} onClick={() => setSelected(e)} style={{ background: e.color ?? TYPE_CONFIG[e.type]?.color ?? '#0a5c36', color: 'white', borderRadius: '3px', padding: '1px 4px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {isRtl ? e.titleAr : e.titleEn}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div style={{ fontSize: '0.6rem', color: '#0a5c36', fontWeight: 700 }}>+{dayEvents.length - 2}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming events sidebar */}
        <div>
          <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '16px', fontSize: '1rem' }}>
            🗓 {isRtl ? 'المواعيد القادمة' : 'Upcoming Events'}
          </h3>
          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>...</div>
          ) : upcomingEvents.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', padding: '32px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              {isRtl ? 'لا مواعيد قادمة' : 'No upcoming events'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingEvents.map(e => {
                const cfg = TYPE_CONFIG[e.type]
                const daysLeft = Math.ceil((new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={e.id} onClick={() => setSelected(e)} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.15s', borderRight: `4px solid ${e.color ?? cfg?.color ?? '#0a5c36'}` }}
                    onMouseEnter={e2 => (e2.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e2 => (e2.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                  >
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{cfg?.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isRtl ? e.titleAr : e.titleEn}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                        {new Date(e.date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { month: 'short', day: 'numeric' })}
                        {daysLeft === 0 ? <span style={{ color: '#dc2626', fontWeight: 700, marginRight: '6px' }}> · {isRtl ? 'اليوم!' : 'Today!'}</span>
                          : daysLeft === 1 ? <span style={{ color: '#d97706', fontWeight: 700, marginRight: '6px' }}> · {isRtl ? 'غداً' : 'Tomorrow'}</span>
                          : <span style={{ marginRight: '6px' }}> · {daysLeft} {isRtl ? 'يوم' : 'days'}</span>}
                      </div>
                    </div>
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

