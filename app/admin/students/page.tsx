'use client'
import { useState, useEffect } from 'react'

interface Student { seatNumber: string; nameAr: string; nameEn: string; gradeAr: string; totalResults: number; latestPct: number; latestStatus: string }

function downloadPDF(resultId: number, seatNumber: string) {
  window.open(`/api/admin/report-card/${resultId}`, '_blank')
}

export default function StudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Student | null>(null)
  const [results, setResults] = useState<{id: number; semester: {nameAr:string}; percentage: number; status: string; totalScore: number; maxScore: number; letterGrade: string}[]>([])

  useEffect(() => {
    fetch('/api/admin/students')
      .then(r => r.json())
      .then(d => { setStudents(d.students ?? []); setLoading(false) })
  }, [])

  async function selectStudent(s: Student) {
    setSelected(s)
    const d = await fetch(`/api/admin/students/${s.seatNumber}`).then(r => r.json())
    setResults(d.results ?? [])
  }

  const filtered = students.filter(s =>
    s.nameAr.includes(search) || s.seatNumber.includes(search) || s.gradeAr.includes(search)
  )

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <a href="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← لوحة التحكم</a>
        <h1 style={{ color: '#0a5c36', fontWeight: 800, margin: 0, fontSize: '1.5rem' }}>👨‍🎓 دليل الطلاب</h1>
        <span style={{ background: '#f0fdf4', color: '#0a5c36', fontWeight: 700, fontSize: '0.85rem', padding: '4px 14px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>{students.length} طالب</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو رقم الجلوس أو الصف"
          style={{ marginRight: 'auto', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.88rem', minWidth: '280px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px' }}>
        {/* Student list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '14px' }}>جاري التحميل...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(s => (
                <div key={s.seatNumber} onClick={() => selectStudent(s)} style={{
                  background: 'white', borderRadius: '12px', padding: '16px 20px',
                  border: selected?.seatNumber === s.seatNumber ? '2px solid #0a5c36' : '1px solid #e2e8f0',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (selected?.seatNumber !== s.seatNumber) (e.currentTarget as HTMLDivElement).style.borderColor = '#bbf7d0' }}
                  onMouseLeave={e => { if (selected?.seatNumber !== s.seatNumber) (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {s.seatNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{s.nameAr}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{s.gradeAr} · {s.totalResults} فصل دراسي</div>
                  </div>
                  {s.latestPct > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.latestPct >= 85 ? '#0a5c36' : s.latestPct >= 60 ? '#d97706' : '#dc2626' }}>{s.latestPct}%</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>آخر نتيجة</div>
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, background: s.latestStatus === 'pass' ? '#f0fdf4' : '#fef2f2', color: s.latestStatus === 'pass' ? '#15803d' : '#dc2626' }}>
                    {s.latestStatus === 'pass' ? 'ناجح' : 'راسب'}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👨‍🎓</div>
                  {search ? 'لا توجد نتائج مطابقة' : 'لا توجد بيانات طلاب — ارفع نتائج من لوحة التحكم أولاً'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student detail */}
        {selected && (
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', padding: '24px', color: 'white', position: 'relative' }}>
                <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 12px' }}>👨‍🎓</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{selected.nameAr}</div>
                  <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>{selected.gradeAr}</div>
                  <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 16px', display: 'inline-block', fontSize: '0.8rem', fontWeight: 700 }}>
                    رقم الجلوس: {selected.seatNumber}
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '14px', fontSize: '0.95rem' }}>📊 سجل النتائج</div>
                {results.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد نتائج</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {results.map((r, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>{r.semester.nameAr}</span>
                          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: r.percentage >= 85 ? '#0a5c36' : r.percentage >= 60 ? '#d97706' : '#dc2626' }}>{r.percentage}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.percentage}%`, background: r.percentage >= 85 ? '#0a5c36' : r.percentage >= 60 ? '#d97706' : '#dc2626', borderRadius: '999px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.totalScore}/{r.maxScore}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, background: r.status === 'pass' ? '#f0fdf4' : '#fef2f2', color: r.status === 'pass' ? '#15803d' : '#dc2626' }}>
                              {r.status === 'pass' ? 'ناجح' : 'راسب'}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); downloadPDF(r.id, selected!.seatNumber) }} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #0a5c36', color: '#0a5c36', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                              📄 PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
