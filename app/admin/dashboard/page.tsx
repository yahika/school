'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import type { Lang } from '@/lib/translations'
import { translations as t } from '@/lib/translations'

// ─── Types ───────────────────────────────────────────────────────────────────
interface SemesterRow {
  id: number; nameAr: string; nameEn: string; academicYear: string; term: string
  isPublished: boolean; totalStudents: number; passCount: number; failCount: number; passRate: number
}

interface ParsedStudent {
  seatNumber: string; nameAr: string; nameEn: string; gradeAr: string; gradeEn: string
  dateOfBirth: string; parentPhone: string
  subjects: { nameAr: string; nameEn: string; score: number; maxScore: number }[]
  totalScore: number; maxScore: number; percentage: number; status: string
}

// ─── Excel Parser ─────────────────────────────────────────────────────────────
function parseExcel(file: File): Promise<{ headers: string[]; students: ParsedStudent[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (rows.length < 2) throw new Error('empty')

        const headerRow: string[] = rows[0].map((h: unknown) => String(h ?? '').trim())
        // Fixed cols: 0=seat, 1=nameAr, 2=nameEn, 3=gradeAr, 4=gradeEn, 5=dob, 6=parentPhone
        // From col 7 onwards: subject score columns
        const subjectHeaders: string[] = headerRow.slice(7)

        const students: ParsedStudent[] = []
        for (let i = 1; i < rows.length; i++) {
          const row: unknown[] = rows[i]
          if (!row || !row[0]) continue

          const seatNumber  = String(row[0] ?? '').trim()
          const nameAr      = String(row[1] ?? '').trim()
          const nameEn      = String(row[2] ?? '').trim()
          const gradeAr     = String(row[3] ?? '').trim()
          const gradeEn     = String(row[4] ?? '').trim()
          const dobRaw      = row[5]
          const parentPhone = String(row[6] ?? '').trim()
          let dateOfBirth   = ''
          if (dobRaw instanceof Date) {
            dateOfBirth = dobRaw.toISOString().slice(0, 10)
          } else if (dobRaw) {
            dateOfBirth = String(dobRaw).slice(0, 10)
          }

          const subjects = subjectHeaders.map((header, idx) => {
            const score = Number(row[7 + idx] ?? 0)
            return { nameAr: header, nameEn: header, score, maxScore: 100 }
          }).filter(s => !isNaN(s.score))

          const totalScore = subjects.reduce((sum, s) => sum + s.score, 0)
          const maxScore   = subjects.reduce((sum, s) => sum + s.maxScore, 0)
          const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
          const failCount  = subjects.filter(s => s.score < s.maxScore * 0.5).length
          const status     = percentage >= 50 && failCount <= 2 ? 'pass' : 'fail'

          students.push({ seatNumber, nameAr, nameEn, gradeAr, gradeEn, dateOfBirth, parentPhone, subjects, totalScore, maxScore, percentage, status })
        }

        resolve({ headers: subjectHeaders, students })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ar')
  const L = t[lang].admin.dashboard
  const isRtl = lang === 'ar'

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored) setLang(stored)
  }, [])

  useEffect(() => {
    document.documentElement.dir  = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRtl])

  // Auth check
  const [adminUser, setAdminUser] = useState('')
  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => { if (!r.ok) router.push('/admin/login'); return r.json() })
      .then(d => d.username && setAdminUser(d.username))
      .catch(() => router.push('/admin/login'))
  }, [router])

  // Semester list
  const [semesters, setSemesters] = useState<SemesterRow[]>([])
  const [semLoading, setSemLoading] = useState(true)

  const loadSemesters = useCallback(async () => {
    setSemLoading(true)
    try {
      const r = await fetch('/api/admin/semesters')
      const d = await r.json()
      setSemesters(d.semesters ?? [])
    } finally { setSemLoading(false) }
  }, [])

  useEffect(() => { loadSemesters() }, [loadSemesters])

  // ── Stats from all published semesters ──────────────────────────────────────
  const totalStudents = semesters.reduce((s, sem) => s + sem.totalStudents, 0)
  const totalPassed   = semesters.reduce((s, sem) => s + sem.passCount, 0)
  const totalFailed   = semesters.reduce((s, sem) => s + sem.failCount, 0)
  const overallRate   = totalStudents > 0 ? Math.round((totalPassed / totalStudents) * 1000) / 10 : 0

  // ── Upload / Preview state ───────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [fileName, setFileName]     = useState('')
  const [preview, setPreview]       = useState<ParsedStudent[]>([])
  const [subjectHeaders, setSubjectHeaders] = useState<string[]>([])
  const [parseError, setParseError] = useState('')

  const [semNameAr,     setSemNameAr]     = useState('')
  const [semNameEn,     setSemNameEn]     = useState('')
  const [academicYear,  setAcademicYear]  = useState('2024-2025')
  const [term,          setTerm]          = useState('first')

  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleFile(file: File) {
    setParseError('')
    setPreview([])
    setFileName(file.name)
    try {
      const { headers, students } = await parseExcel(file)
      setSubjectHeaders(headers)
      setPreview(students)
    } catch {
      setParseError(L.uploadError)
      setFileName('')
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSave() {
    if (!preview.length || !semNameAr || !semNameEn || !academicYear || !term) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: semNameAr, nameEn: semNameEn, academicYear, term, results: preview }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? t[lang].errors.serverError)
      }
      showToast(L.saveSuccess)
      setPreview([]); setFileName(''); setSemNameAr(''); setSemNameEn('')
      loadSemesters()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t[lang].errors.serverError, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(id: number, isPublished: boolean) {
    const res = await fetch(`/api/admin/semesters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    const data = await res.json().catch(() => ({}))

    if (!isPublished && data.whatsapp) {
      const { sent, failed, skipped } = data.whatsapp
      const msg = `✅ تم النشر — واتساب: ${sent} أُرسلت${failed ? ` · ${failed} فشلت` : ''}${skipped ? ` · ${skipped} بدون رقم` : ''}`
      showToast(msg, sent > 0 ? 'success' : 'error')
    } else {
      showToast(isPublished ? L.unpublishBtn : L.publishSuccess)
    }
    loadSemesters()
  }

  async function handleDelete(id: number) {
    if (!confirm(L.deleteConfirm)) return
    await fetch(`/api/admin/semesters/${id}`, { method: 'DELETE' })
    showToast(L.deleteSuccess)
    loadSemesters()
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  function downloadTemplate() {
    window.open('/api/admin/template', '_blank')
  }

  const termLabels: Record<string, string> = {
    first: L.termFirst, second: L.termSecond, final: L.termFinal
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--c-primary-dark)', color: 'white',
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8972b, #a07820)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
        }}>AEA</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{L.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {adminUser && `@${adminUser}`}
          </div>
        </div>
        <button
          onClick={() => {
            const next: Lang = lang === 'ar' ? 'en' : 'ar'
            setLang(next); localStorage.setItem('lang', next)
          }}
          style={{
            padding: '5px 12px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >🌐 {t[lang].nav.langToggle}</button>
        <a href="/" style={{
          padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem',
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none'
        }}>
          {t[lang].nav.home}
        </a>
        <button onClick={handleLogout} className="btn-primary btn-danger btn-sm">
          {L.logout}
        </button>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 16px' }}>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: L.statsTotal,   value: totalStudents, icon: '📊', color: 'var(--c-primary)' },
            { label: L.statsPassed,  value: totalPassed,   icon: '✅', color: 'var(--c-success)' },
            { label: L.statsFailed,  value: totalFailed,   icon: '❌', color: 'var(--c-danger)' },
            { label: L.statsRate,    value: `${overallRate}%`, icon: '📈', color: '#2563eb' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Upload Section ── */}
        <div className="card" style={{ padding: '28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ color: 'var(--c-primary)', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 4px' }}>
                📂 {L.uploadTitle}
              </h2>
              <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', margin: 0 }}>{L.uploadDesc}</p>
            </div>
            <button className="btn-primary btn-sm" onClick={downloadTemplate} style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              📥 {L.downloadTemplate}
            </button>
          </div>

          {/* Semester form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">{L.semNameAr} *</label>
              <input className="form-input" value={semNameAr} onChange={e => setSemNameAr(e.target.value)}
                placeholder="الفصل الأول 2024-2025" />
            </div>
            <div>
              <label className="form-label">{L.semNameEn} *</label>
              <input className="form-input" value={semNameEn} onChange={e => setSemNameEn(e.target.value)}
                placeholder="First Semester 2024-2025" dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }} />
            </div>
            <div>
              <label className="form-label">{L.academicYear} *</label>
              <input className="form-input" value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                placeholder="2024-2025" dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }} />
            </div>
            <div>
              <label className="form-label">{L.term}</label>
              <select className="form-input" value={term} onChange={e => setTerm(e.target.value)} style={{ appearance: 'auto' }}>
                <option value="first">{L.termFirst}</option>
                <option value="second">{L.termSecond}</option>
                <option value="final">{L.termFinal}</option>
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={onFileInputChange} />
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{fileName ? '📄' : '📁'}</div>
            {fileName
              ? <div style={{ fontWeight: 600, color: 'var(--c-primary)' }}>{fileName}</div>
              : <div style={{ color: 'var(--c-text-muted)', fontWeight: 500 }}>{L.dragDrop}</div>
            }
            <div style={{ fontSize: '0.8rem', color: 'var(--c-text-light)', marginTop: '6px' }}>{L.fileTypes}</div>
          </div>

          {parseError && (
            <div style={{ marginTop: '12px', color: 'var(--c-danger)', fontSize: '0.875rem', background: 'var(--c-danger-bg)', padding: '10px 14px', borderRadius: '6px' }}>
              {parseError}
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        {preview.length > 0 && (
          <div className="card" style={{ marginBottom: '28px', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--c-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <h3 style={{ color: 'var(--c-primary)', fontWeight: 700, margin: '0 0 3px' }}>
                  👁️ {L.previewTitle}
                </h3>
                <p style={{ color: 'var(--c-text-muted)', fontSize: '0.83rem', margin: 0 }}>
                  {preview.length} {L.previewCount} — {L.previewDesc}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !semNameAr || !semNameEn}
                style={{ minWidth: '160px' }}
              >
                {saving ? <><span className="spinner" /> {L.savingBtn}</> : <>💾 {L.saveBtn}</>}
              </button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '360px' }}>
              <table className="data-table" style={{ minWidth: '700px' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>#</th>
                    <th>رقم الجلوس</th>
                    <th>الاسم</th>
                    <th>الصف</th>
                    <th style={{ textAlign: 'center' }}>المجموع</th>
                    <th style={{ textAlign: 'center' }}>النسبة</th>
                    <th style={{ textAlign: 'center' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--c-text-light)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.seatNumber}</td>
                      <td>{s.nameAr}</td>
                      <td style={{ color: 'var(--c-text-muted)' }}>{s.gradeAr}</td>
                      <td style={{ textAlign: 'center' }}>{s.totalScore}/{s.maxScore}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.percentage}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                          background: s.status === 'pass' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
                          color: s.status === 'pass' ? 'var(--c-success)' : 'var(--c-danger)',
                        }}>
                          {s.status === 'pass' ? t[lang].result.pass : t[lang].result.fail}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Semesters List ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--c-border)', background: '#f8fafc' }}>
            <h2 style={{ color: 'var(--c-primary)', fontWeight: 700, margin: 0 }}>
              📚 {L.semestersTitle}
            </h2>
          </div>

          {semLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
              <span className="spinner" style={{ borderTopColor: 'var(--c-primary)', borderColor: 'var(--c-border)', margin: '0 auto', display: 'block', width: '24px', height: '24px' }} />
            </div>
          ) : semesters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
              {L.noSemesters}
            </div>
          ) : (
            <div>
              {semesters.map(sem => (
                <div key={sem.id} style={{
                  padding: '18px 24px', borderBottom: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--c-text)' }}>
                      {lang === 'ar' ? sem.nameAr : sem.nameEn}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', marginTop: '3px' }}>
                      {sem.totalStudents} {L.students} · {sem.passCount} ✅ · {sem.failCount} ❌ · {sem.passRate}%
                      · {termLabels[sem.term] ?? sem.term}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                      background: sem.isPublished ? 'var(--c-success-bg)' : 'var(--c-warning-bg)',
                      color: sem.isPublished ? 'var(--c-success)' : 'var(--c-warning)',
                    }}>
                      {sem.isPublished ? `● ${L.published}` : `○ ${L.unpublished}`}
                    </span>
                    <button
                      className={`btn-primary btn-sm ${sem.isPublished ? 'btn-outline' : ''}`}
                      onClick={() => handlePublish(sem.id, sem.isPublished)}
                      style={sem.isPublished ? { color: 'var(--c-warning)', borderColor: 'var(--c-warning)' } : {}}
                    >
                      {sem.isPublished ? L.unpublishBtn : L.publishBtn}
                    </button>
                    <button
                      className="btn-primary btn-danger btn-sm"
                      onClick={() => handleDelete(sem.id)}
                    >
                      🗑️ {L.deleteBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  )
}
