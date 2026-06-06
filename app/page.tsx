'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lang } from '@/lib/translations'
import { translations as t } from '@/lib/translations'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Subject {
  id: number; nameAr: string; nameEn: string | null
  score: number; maxScore: number; status: string; orderIdx: number
}
interface Semester { nameAr: string; nameEn: string; academicYear: string; term: string }
interface Result {
  id: number; seatNumber: string; nameAr: string; nameEn: string | null
  gradeAr: string; gradeEn: string | null
  totalScore: number; maxScore: number; percentage: number
  status: string; letterGrade: string | null
  subjects: Subject[]; semester: Semester
}
interface SemesterOption { id: number; nameAr: string; nameEn: string }

// ─── Grade color helper ───────────────────────────────────────────────────────
function gradeColor(lg: string) {
  if (['A+','A','A-'].includes(lg)) return '#16a34a'
  if (['B+','B','B-'].includes(lg)) return '#2563eb'
  if (['C+','C','C-'].includes(lg)) return '#d97706'
  if (['D+','D'].includes(lg))       return '#ea580c'
  return '#dc2626'
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ar')
  const L = t[lang]
  const isRtl = lang === 'ar'

  // Sync html dir + lang attributes
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored) setLang(stored)
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  useEffect(() => {
    document.documentElement.dir  = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRtl])

  // ── Form state ──────────────────────────────────────────────────────────────
  const [seat, setSeat]   = useState('')
  const [name, setName]   = useState('')
  const [dob,  setDob]    = useState('')
  const [semId, setSemId] = useState('')

  const [result,    setResult]    = useState<Result | null>(null)
  const [results,   setResults]   = useState<Result[]>([])   // multiple name matches
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [semesters, setSemesters] = useState<SemesterOption[]>([])

  // ── Load published semesters for dropdown ───────────────────────────────────
  useEffect(() => {
    fetch('/api/search/semesters')
      .then(r => r.json())
      .then(d => d.semesters && setSemesters(d.semesters))
      .catch(() => {})
  }, [])

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setResults([])
    setError(null)

    if (!seat.trim() && !name.trim()) {
      setError('seatOrName'); return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (seat.trim())  params.set('seat', seat.trim())
      if (name.trim())  params.set('name', name.trim())
      if (dob.trim())   params.set('dob', dob.trim())
      if (semId)        params.set('semesterId', semId)

      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'serverError'); return }

      if (data.results) {
        // Multiple name matches
        setResults(data.results)
      } else {
        setResult(data.result)
      }
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch {
      setError('serverError')
    } finally {
      setLoading(false)
    }
  }, [seat, name, dob, semId])

  function clearForm() {
    setSeat(''); setName(''); setDob(''); setSemId('')
    setResult(null); setResults([]); setError(null)
  }

  // ── Error display map ───────────────────────────────────────────────────────
  const errMap: Record<string, { title: string; desc: string }> = {
    notFound:     { title: L.errors.notFound,     desc: L.errors.notFoundDesc },
    verifyFailed: { title: L.errors.notFound,     desc: L.errors.verifyFailed },
    dobRequired:  { title: L.errors.dobRequired,  desc: L.errors.dobRequired },
    seatOrName:   { title: L.errors.seatOrName,   desc: L.errors.seatOrName },
    noPublished:  { title: L.errors.notFound,     desc: L.errors.noPublished },
    serverError:  { title: L.errors.serverError,  desc: L.errors.serverError },
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <header className="hero no-print" style={{ paddingBottom: '90px' }}>
        {/* Nav bar */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', maxWidth: '900px', margin: '0 auto', width: '100%'
        }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            {L.nav.home}
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="lang-toggle" onClick={toggleLang}>
              🌐 {L.nav.langToggle}
            </button>
            <a href="/admin/login" style={{
              padding: '6px 14px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textDecoration: 'none',
              transition: 'background 0.2s'
            }}>
              {L.nav.admin}
            </a>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ textAlign: 'center', padding: '32px 24px 20px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className="school-logo">AEA</div>
          </div>

          <h1 style={{ color: 'white', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, margin: '0 0 6px' }}>
            {L.school.name}
          </h1>
          <div style={{
            display: 'inline-block', background: 'rgba(200,151,43,0.25)', border: '1px solid rgba(200,151,43,0.4)',
            borderRadius: '999px', padding: '4px 16px', marginBottom: '10px'
          }}>
            <span style={{ color: '#e5b850', fontSize: '0.85rem', fontWeight: 600 }}>
              {L.school.portal}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: 0 }}>
            {L.school.subtitle}
          </p>
        </div>
      </header>

      {/* ── SEARCH CARD (overlapping hero) ──────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: '760px', width: '100%', margin: '0 auto', padding: '0 16px 48px' }}>
        <div className="search-card no-print" style={{ padding: '32px', marginTop: '-56px', position: 'relative', zIndex: 10 }}>
          <h2 style={{ color: 'var(--c-primary)', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 6px' }}>
            🔍 {L.search.cardTitle}
          </h2>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', margin: '0 0 24px' }}>
            {L.search.securityNote}
          </p>

          <form onSubmit={handleSearch}>
            {/* Row 1: Seat + Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">{L.search.seatLabel} *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={L.search.seatPlaceholder}
                  value={seat}
                  onChange={e => setSeat(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-light)' }}>{L.search.seatHint}</span>
              </div>
              <div>
                <label className="form-label">{L.search.nameLabel}</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={L.search.namePlaceholder}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-light)' }}>{L.search.nameHint}</span>
              </div>
            </div>

            {/* Row 2: DOB + Semester */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="form-label">
                  {L.search.dobLabel}
                  <span style={{ color: 'var(--c-text-light)', fontSize: '0.72rem', marginInlineStart: '4px' }}>
                    {'اختياري'}
                  </span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  dir="ltr"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-light)' }}>{'لتضييق نتائج البحث بالاسم'}</span>
              </div>
              <div>
                <label className="form-label">{L.search.semesterLabel}</label>
                <select
                  className="form-input"
                  value={semId}
                  onChange={e => setSemId(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">{L.search.semesterAll}</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>
                      {lang === 'ar' ? s.nameAr : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, minWidth: '180px' }}>
                {loading ? <><span className="spinner" /> {L.search.buttonSearching}</> : <>🔍 {L.search.button}</>}
              </button>
              <button type="button" className="btn-primary btn-outline" onClick={clearForm} style={{ minWidth: '100px' }}>
                ✕ {L.search.clear}
              </button>
            </div>
          </form>
        </div>

        {/* ── ERROR STATE ─────────────────────────────────────────────────── */}
        {error && (
          <div className="animate-fade-up" style={{
            marginTop: '24px', padding: '20px 24px',
            background: 'var(--c-danger-bg)', border: '1px solid #fca5a5',
            borderRadius: 'var(--radius)', display: 'flex', gap: '16px', alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>❌</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--c-danger)', marginBottom: '4px' }}>
                {errMap[error]?.title ?? error}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#b91c1c' }}>
                {errMap[error]?.desc ?? ''}
              </div>
            </div>
          </div>
        )}

        {/* ── MULTIPLE NAME MATCHES ───────────────────────────────────────── */}
        {results.length > 1 && (
          <div id="result-section" className="animate-fade-up" style={{ marginTop: '24px' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--c-border)', background: '#f8fafc' }}>
                <div style={{ fontWeight: 700, color: 'var(--c-primary)', marginBottom: '3px' }}>
                  👥 {results.length} {lang === 'ar' ? 'نتيجة مطابقة — اختر الطالب' : 'matches found — select a student'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--c-text-muted)' }}>
                  {lang === 'ar' ? 'أضف تاريخ الميلاد لتضييق النتائج' : 'Add date of birth to narrow results'}
                </div>
              </div>
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setResult(r); setResults([]) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    width: '100%', padding: '14px 24px',
                    borderBottom: '1px solid var(--c-border)',
                    background: 'white', border: 'none', cursor: 'pointer',
                    textAlign: isRtl ? 'right' : 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--c-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {r.seatNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>
                      {lang === 'ar' ? r.nameAr : (r.nameEn ?? r.nameAr)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>
                      {lang === 'ar' ? r.gradeAr : (r.gradeEn ?? r.gradeAr)}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                    background: r.status === 'pass' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
                    color: r.status === 'pass' ? 'var(--c-success)' : 'var(--c-danger)',
                  }}>
                    {r.status === 'pass' ? (lang === 'ar' ? 'ناجح' : 'Pass') : (lang === 'ar' ? 'راسب' : 'Fail')}
                  </span>
                  <span style={{ color: 'var(--c-text-light)', fontSize: '1.1rem' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT CARD ─────────────────────────────────────────────────── */}
        {result && <ResultCard result={result} lang={lang} L={L} />}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="no-print" style={{
        background: 'var(--c-primary-dark)', color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', padding: '20px', fontSize: '0.82rem'
      }}>
        © {new Date().getFullYear()} {L.school.name} — {L.footer.rights}
      </footer>
    </div>
  )
}

// ─── Result Card Component ────────────────────────────────────────────────────
function ResultCard({ result, lang, L }: { result: Result; lang: Lang; L: typeof t.ar }) {
  const isRtl = lang === 'ar'
  const isPass = result.status === 'pass'
  const gradeLabel = result.letterGrade
    ? (L.result.gradeLabels as Record<string, string>)[result.letterGrade] ?? result.letterGrade
    : ''

  function handlePrint() { window.print() }

  return (
    <div id="result-section" className="result-card animate-fade-up" style={{ marginTop: '32px' }}>
      {/* ── Header ── */}
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <div className="result-header-logo">AEA</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              {L.school.name}
            </div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
              {L.result.title}
            </div>
          </div>
          <div style={{ marginInlineStart: 'auto' }}>
            <span style={{
              fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.1)', padding: '3px 10px',
              borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)'
            }}>
              {L.result.officialNote}
            </span>
          </div>
        </div>

        {/* Student info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', position: 'relative', zIndex: 1 }}>
          {[
            { label: L.result.studentName, value: lang === 'ar' ? result.nameAr : (result.nameEn ?? result.nameAr) },
            { label: L.result.seatNumber,  value: result.seatNumber },
            { label: L.result.grade,       value: lang === 'ar' ? result.gradeAr : (result.gradeEn ?? result.gradeAr) },
            { label: L.result.semester,    value: lang === 'ar' ? result.semester.nameAr : result.semester.nameEn },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
              padding: '10px 14px', border: '1px solid rgba(255,255,255,0.12)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 500, marginBottom: '3px' }}>
                {item.label}
              </div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Print date — shows only in print */}
        <div className="print-only" style={{ display: 'none', marginTop: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
          {L.result.printDate}: {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
        </div>
      </div>

      {/* ── Subjects Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>{L.result.subject}</th>
              <th style={{ textAlign: 'center' }}>{L.result.score}</th>
              <th style={{ textAlign: 'center' }}>{L.result.outOf}</th>
              <th style={{ textAlign: 'center' }}>{L.result.pct}</th>
              <th style={{ textAlign: 'center' }}>{L.result.subStatus}</th>
            </tr>
          </thead>
          <tbody>
            {result.subjects.map(sub => {
              const subPct = Math.round((sub.score / sub.maxScore) * 100)
              const subPass = sub.status === 'pass'
              return (
                <tr key={sub.id} className="subject-row">
                  <td style={{ fontWeight: 500 }}>
                    {lang === 'ar' ? sub.nameAr : (sub.nameEn ?? sub.nameAr)}
                  </td>
                  <td style={{ textAlign: 'center' }} className={subPass ? 'subject-score-pass' : 'subject-score-fail'}>
                    {sub.score}
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--c-text-muted)' }}>{sub.maxScore}</td>
                  <td style={{ textAlign: 'center', color: 'var(--c-text-muted)' }}>{subPct}%</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                      background: subPass ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
                      color: subPass ? 'var(--c-success)' : 'var(--c-danger)',
                    }}>
                      {subPass ? L.result.passSubject : L.result.failSubject}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Summary Bar ── */}
      <div style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderTop: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px'
      }}>
        {/* Totals */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>{L.result.total}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-primary)' }}>
              {result.totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>/ {result.maxScore}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>{L.result.totalPct}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-primary)' }}>
              {result.percentage}%
            </div>
          </div>
          {result.letterGrade && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>{L.result.letterGrade}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: gradeColor(result.letterGrade) }}>
                {result.letterGrade}
                <span style={{ fontSize: '0.85rem', marginInlineStart: '6px', color: 'var(--c-text-muted)' }}>
                  {gradeLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pass / Fail badge */}
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', fontWeight: 500, marginBottom: '6px', textAlign: 'center' }}>
            {L.result.finalResult}
          </div>
          <span className={`status-badge ${isPass ? 'status-pass' : 'status-fail'}`} style={{ fontSize: '1.25rem' }}>
            {isPass ? '✅' : '❌'} {isPass ? L.result.pass : L.result.fail}
          </span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="no-print" style={{
        padding: '16px 24px', borderTop: '1px solid var(--c-border)',
        display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--c-text-light)', alignSelf: 'center' }}>
          {L.result.printHint}
        </span>
        <button className="btn-primary btn-gold btn-sm" onClick={handlePrint}>
          🖨️ {L.result.print}
        </button>
      </div>
    </div>
  )
}
