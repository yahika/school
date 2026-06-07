'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Parent { id: number; name: string; email: string; phone: string; studentName: string; seatNumber: string; gradeAr: string; gradeEn: string }
interface Subject { nameAr: string; nameEn: string; score: number; maxScore: number; passMark: number; status: string }
interface Result { id: number; seatNumber: string; nameAr: string; gradeAr: string; totalScore: number; maxScore: number; percentage: number; status: string; letterGrade: string; rank: number; subjects: Subject[]; semester: { nameAr: string; nameEn: string; academicYear: string; term: string } }
interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; publishedAt: string }

export default function ParentDashboard() {
  const router = useRouter()
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [parent, setParent] = useState<Parent | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'results'|'announcements'|'profile'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('lang') as 'ar'|'en' | null
    if (stored) setLang(stored)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [meRes, resultsRes, annRes] = await Promise.all([
          fetch('/api/parent/me'),
          fetch('/api/parent/results'),
          fetch('/api/announcements'),
        ])
        if (!meRes.ok) { router.push('/parent/login'); return }
        const meData = await meRes.json()
        const resultsData = await resultsRes.json()
        const annData = await annRes.json()
        setParent(meData.parent)
        setResults(resultsData.results ?? [])
        setAnnouncements((annData.announcements ?? []).slice(0, 5))
        if (resultsData.results?.length > 0) setSelectedResult(resultsData.results[0])
      } catch { router.push('/parent/login') }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  async function logout() {
    await fetch('/api/parent/logout', { method: 'POST' })
    router.push('/parent/login')
  }

  function toggleLang() {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next); localStorage.setItem('lang', next)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#0a5c36', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#64748b', fontFamily: 'Tajawal,sans-serif' }}>جاري التحميل...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!parent) return null

  const latestResult = results[0]
  const gradeColor = (pct: number) => pct >= 90 ? '#15803d' : pct >= 75 ? '#0a5c36' : pct >= 60 ? '#d97706' : pct >= 50 ? '#ea580c' : '#dc2626'
  const gradeLabel = (letter: string) => {
    const map: Record<string,string> = { 'A+': 'ممتاز+', 'A': 'ممتاز', 'A-': 'ممتاز-', 'B+': 'جيد جداً+', 'B': 'جيد جداً', 'B-': 'جيد جداً-', 'C+': 'جيد+', 'C': 'جيد', 'C-': 'جيد-', 'D+': 'مقبول+', 'D': 'مقبول', 'E': 'ضعيف', 'F': 'راسب' }
    return lang === 'ar' ? (map[letter] ?? letter) : letter
  }

  const navItems = [
    { key: 'overview', icon: '🏠', label: isRtl ? 'نظرة عامة' : 'Overview' },
    { key: 'results', icon: '📊', label: isRtl ? 'النتائج' : 'Results' },
    { key: 'announcements', icon: '📢', label: isRtl ? 'الإعلانات' : 'Announcements' },
    { key: 'profile', icon: '👤', label: isRtl ? 'الملف الشخصي' : 'Profile' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); animation: fadeIn 0.3s ease; }
        .nav-item { cursor: pointer; transition: all 0.2s; }
        .nav-item:hover { background: rgba(10,92,54,0.08) !important; }
      `}</style>

      {/* Top bar */}
      <header style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', color: 'white' }}>AEA</div>
          </a>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{isRtl ? 'بوابة أولياء الأمور' : 'Parent Portal'}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{isRtl ? `مرحباً، ${parent.name}` : `Welcome, ${parent.name}`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={toggleLang} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            🌐 {lang === 'ar' ? 'English' : 'عربي'}
          </button>
          <button onClick={logout} style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', borderRadius: '8px', padding: '5px 14px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {isRtl ? 'خروج' : 'Logout'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>

        {/* Sidebar */}
        <aside>
          {/* Student card */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.6rem' }}>👨‍🎓</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}>{parent.studentName}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>{lang === 'ar' ? parent.gradeAr : parent.gradeEn}</div>
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>{isRtl ? 'رقم الجلوس' : 'Seat Number'}</div>
              <div style={{ fontWeight: 800, color: '#0a5c36', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{parent.seatNumber}</div>
            </div>
            {latestResult && (
              <div style={{ marginTop: '12px', background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>{isRtl ? 'آخر نتيجة' : 'Latest Result'}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: gradeColor(latestResult.percentage) }}>{latestResult.percentage}%</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: gradeColor(latestResult.percentage) }}>{gradeLabel(latestResult.letterGrade ?? 'F')}</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="card" style={{ padding: '8px' }}>
            {navItems.map(item => (
              <button key={item.key} className="nav-item" onClick={() => setActiveTab(item.key as typeof activeTab)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '10px', border: 'none',
                background: activeTab === item.key ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'transparent',
                color: activeTab === item.key ? '#0a5c36' : '#64748b',
                fontWeight: activeTab === item.key ? 700 : 500,
                fontFamily: 'inherit', fontSize: '0.88rem', cursor: 'pointer',
                borderRight: activeTab === item.key && isRtl ? '3px solid #0a5c36' : 'none',
                borderLeft: activeTab === item.key && !isRtl ? '3px solid #0a5c36' : 'none',
                textAlign: isRtl ? 'right' : 'left',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '20px', fontSize: '1.3rem' }}>
                {isRtl ? `مرحباً، ${parent.name} 👋` : `Welcome back, ${parent.name} 👋`}
              </h2>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { icon: '📊', label: isRtl ? 'الفصول الدراسية' : 'Semesters', value: results.length, color: '#0a5c36' },
                  { icon: '📢', label: isRtl ? 'الإعلانات' : 'Announcements', value: announcements.length, color: '#2563eb' },
                  { icon: '🎯', label: isRtl ? 'أحدث نسبة' : 'Latest Score', value: latestResult ? `${latestResult.percentage}%` : '—', color: latestResult ? gradeColor(latestResult.percentage) : '#64748b' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Latest result preview */}
              {latestResult && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginBottom: '4px' }}>
                        {lang === 'ar' ? latestResult.semester.nameAr : latestResult.semester.nameEn}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{latestResult.semester.academicYear}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: gradeColor(latestResult.percentage), lineHeight: 1 }}>{latestResult.percentage}%</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: gradeColor(latestResult.percentage) }}>{gradeLabel(latestResult.letterGrade ?? 'F')}</div>
                    </div>
                  </div>

                  {/* Subject bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {latestResult.subjects.map(sub => {
                      const pct = Math.round((sub.score / sub.maxScore) * 100)
                      const passed = sub.status === 'pass'
                      return (
                        <div key={sub.nameAr}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151' }}>{lang === 'ar' ? sub.nameAr : sub.nameEn}</span>
                            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: passed ? '#0a5c36' : '#dc2626' }}>{sub.score}/{sub.maxScore}</span>
                          </div>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '999px', background: passed ? (pct >= 85 ? '#0a5c36' : '#16a34a') : '#dc2626', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button onClick={() => setActiveTab('results')} style={{ marginTop: '20px', padding: '10px 24px', background: '#0a5c36', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                    {isRtl ? 'عرض كل النتائج ←' : 'View All Results →'}
                  </button>
                </div>
              )}

              {/* Latest announcements */}
              {announcements.length > 0 && (
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '16px', fontSize: '1rem' }}>
                    📢 {isRtl ? 'آخر الإعلانات' : 'Latest Announcements'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {announcements.slice(0, 3).map(a => (
                      <div key={a.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '4px' }}>{lang === 'ar' ? a.titleAr : a.titleEn}</div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{(lang === 'ar' ? a.bodyAr : a.bodyEn).slice(0, 100)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RESULTS */}
          {activeTab === 'results' && (
            <div>
              <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '20px', fontSize: '1.3rem' }}>
                📊 {isRtl ? 'النتائج الأكاديمية' : 'Academic Results'}
              </h2>

              {results.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                  <div style={{ color: '#64748b' }}>{isRtl ? 'لا توجد نتائج منشورة بعد' : 'No results published yet'}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Semester selector */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {results.map(r => (
                      <button key={r.id} onClick={() => setSelectedResult(r)} style={{
                        padding: '8px 18px', borderRadius: '999px', border: '2px solid',
                        borderColor: selectedResult?.id === r.id ? '#0a5c36' : '#e2e8f0',
                        background: selectedResult?.id === r.id ? '#0a5c36' : 'white',
                        color: selectedResult?.id === r.id ? 'white' : '#64748b',
                        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
                        transition: 'all 0.2s',
                      }}>
                        {lang === 'ar' ? r.semester.nameAr : r.semester.nameEn}
                      </button>
                    ))}
                  </div>

                  {selectedResult && (
                    <div className="card" style={{ padding: '28px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', marginBottom: '4px' }}>
                            {lang === 'ar' ? selectedResult.semester.nameAr : selectedResult.semester.nameEn}
                          </h3>
                          <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{selectedResult.semester.academicYear}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: gradeColor(selectedResult.percentage), lineHeight: 1 }}>{selectedResult.percentage}%</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedResult.totalScore}/{selectedResult.maxScore}</div>
                          </div>
                          <div style={{ textAlign: 'center', background: selectedResult.status === 'pass' ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', padding: '12px 20px', border: `1px solid ${selectedResult.status === 'pass' ? '#86efac' : '#fca5a5'}` }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: selectedResult.status === 'pass' ? '#15803d' : '#dc2626' }}>{gradeLabel(selectedResult.letterGrade ?? 'F')}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: selectedResult.status === 'pass' ? '#15803d' : '#dc2626' }}>
                              {selectedResult.status === 'pass' ? (isRtl ? 'ناجح ✓' : 'Passed ✓') : (isRtl ? 'راسب ✗' : 'Failed ✗')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subjects table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: '#0a5c36', color: 'white' }}>
                              <th style={{ padding: '12px 16px', textAlign: isRtl ? 'right' : 'left', borderRadius: isRtl ? '0 8px 8px 0' : '8px 0 0 8px' }}>{isRtl ? 'المادة' : 'Subject'}</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center' }}>{isRtl ? 'الدرجة' : 'Score'}</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center' }}>{isRtl ? 'النسبة' : 'Percentage'}</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', borderRadius: isRtl ? '8px 0 0 8px' : '0 8px 8px 0' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedResult.subjects.map((sub, i) => {
                              const pct = Math.round((sub.score / sub.maxScore) * 100)
                              const passed = sub.status === 'pass'
                              return (
                                <tr key={sub.nameAr} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{lang === 'ar' ? sub.nameAr : sub.nameEn}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: passed ? '#0a5c36' : '#dc2626' }}>{sub.score}/{sub.maxScore}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                      <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', maxWidth: '80px' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: passed ? '#0a5c36' : '#dc2626', borderRadius: '999px' }} />
                                      </div>
                                      <span style={{ fontWeight: 600, color: '#374151', minWidth: '40px' }}>{pct}%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: passed ? '#f0fdf4' : '#fef2f2', color: passed ? '#15803d' : '#dc2626' }}>
                                      {passed ? (isRtl ? 'ناجح' : 'Pass') : (isRtl ? 'راسب' : 'Fail')}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: '#0f172a', color: 'white' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 800, borderRadius: isRtl ? '0 8px 8px 0' : '8px 0 0 8px' }}>{isRtl ? 'الإجمالي' : 'Total'}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900 }}>{selectedResult.totalScore}/{selectedResult.maxScore}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900 }}>{selectedResult.percentage}%</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', borderRadius: isRtl ? '8px 0 0 8px' : '0 8px 8px 0' }}>
                                <span style={{ fontWeight: 800 }}>{selectedResult.status === 'pass' ? '✓' : '✗'}</span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Print button */}
                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => window.print()} style={{ padding: '10px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', color: '#374151' }}>
                          🖨️ {isRtl ? 'طباعة النتيجة' : 'Print Result'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div>
              <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '20px', fontSize: '1.3rem' }}>
                📢 {isRtl ? 'الإعلانات والأخبار' : 'Announcements & News'}
              </h2>
              {announcements.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                  <div style={{ color: '#64748b' }}>{isRtl ? 'لا توجد إعلانات حالياً' : 'No announcements yet'}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {announcements.map((a, i) => (
                    <div key={a.id} className="card" style={{ padding: '24px', borderTop: `4px solid ${['#0a5c36','#2563eb','#c8972b','#7c3aed','#dc2626'][i % 5]}` }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                        {new Date(a.publishedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '10px', fontSize: '1rem' }}>{lang === 'ar' ? a.titleAr : a.titleEn}</h3>
                      <p style={{ color: '#475569', lineHeight: 1.8, margin: 0, fontSize: '0.9rem' }}>{lang === 'ar' ? a.bodyAr : a.bodyEn}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '20px', fontSize: '1.3rem' }}>
                👤 {isRtl ? 'ملفي الشخصي' : 'My Profile'}
              </h2>
              <div className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>👨‍👩‍👧</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: '4px' }}>{parent.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.88rem' }}>{isRtl ? 'ولي أمر' : 'Parent / Guardian'}</div>
                  </div>
                </div>
                {[
                  { icon: '✉️', label: isRtl ? 'البريد الإلكتروني' : 'Email', value: parent.email },
                  { icon: '📞', label: isRtl ? 'الهاتف' : 'Phone', value: parent.phone || '—' },
                  { icon: '👨‍🎓', label: isRtl ? 'اسم الطالب' : 'Student Name', value: parent.studentName },
                  { icon: '🎓', label: isRtl ? 'الصف' : 'Grade', value: lang === 'ar' ? parent.gradeAr : parent.gradeEn },
                  { icon: '🔢', label: isRtl ? 'رقم الجلوس' : 'Seat Number', value: parent.seatNumber },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', width: '28px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
