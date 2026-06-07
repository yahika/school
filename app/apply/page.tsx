'use client'
import { useState } from 'react'

const grades = [
  'KG1','KG2','الصف الأول','الصف الثاني','الصف الثالث','الصف الرابع',
  'الصف الخامس','الصف السادس','الصف السابع','الصف الثامن','الصف التاسع',
  'الصف العاشر','الصف الحادي عشر','الصف الثاني عشر',
]

export default function ApplyPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const isRtl = lang === 'ar'
  const [form, setForm] = useState({
    studentNameAr: '', studentNameEn: '', dateOfBirth: '',
    gradeApplying: '', parentName: '', parentPhone: '',
    parentEmail: '', address: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.')
    } finally { setLoading(false) }
  }

  const L = {
    ar: {
      title: 'طلب التسجيل والقبول',
      subtitle: 'أكملوا النموذج التالي وسنتواصل معكم خلال 48 ساعة',
      studentInfo: 'بيانات الطالب',
      parentInfo: 'بيانات ولي الأمر',
      nameAr: 'الاسم بالعربية *', nameEn: 'الاسم بالإنجليزية',
      dob: 'تاريخ الميلاد *', grade: 'الصف المطلوب *',
      parentName: 'اسم ولي الأمر *', phone: 'رقم الهاتف *',
      email: 'البريد الإلكتروني', address: 'العنوان',
      notes: 'ملاحظات إضافية', submit: 'إرسال الطلب',
      success: '✅ تم إرسال طلبكم بنجاح! سنتواصل معكم قريباً.',
      home: 'الرئيسية', lang: 'English',
    },
    en: {
      title: 'Enrollment Application',
      subtitle: 'Fill out the form below and we will contact you within 48 hours',
      studentInfo: 'Student Information',
      parentInfo: 'Parent / Guardian Information',
      nameAr: 'Full Name (Arabic) *', nameEn: 'Full Name (English)',
      dob: 'Date of Birth *', grade: 'Grade Applying For *',
      parentName: 'Parent Name *', phone: 'Phone Number *',
      email: 'Email Address', address: 'Address',
      notes: 'Additional Notes', submit: 'Submit Application',
      success: '✅ Your application has been submitted! We will contact you soon.',
      home: 'Home', lang: 'عربي',
    },
  }[lang]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: isRtl ? 'Tajawal,sans-serif' : 'Poppins,sans-serif' }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Nav */}
      <nav style={{ background: '#0a5c36', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>AEA</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>{L.home}</a>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>🌐 {L.lang}</button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#063d22,#0a5c36)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, margin: '0 0 8px' }}>📝 {L.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>{L.subtitle}</p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 16px' }}>
        {success ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '16px', padding: '40px', textAlign: 'center', fontSize: '1.1rem', color: '#15803d', fontWeight: 600 }}>
            {L.success}
            <br /><br />
            <a href="/" style={{ color: '#0a5c36', fontWeight: 700 }}>← {L.home}</a>
          </div>
        ) : (
          <form onSubmit={submit}>
            {/* Student */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '20px', fontSize: '1.1rem' }}>👨‍🎓 {L.studentInfo}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: L.nameAr, key: 'studentNameAr', type: 'text', required: true },
                  { label: L.nameEn, key: 'studentNameEn', type: 'text', required: false },
                  { label: L.dob, key: 'dateOfBirth', type: 'date', required: true },
                ].map(f => (
                  <div key={f.key} style={f.key === 'dateOfBirth' ? { gridColumn: 'span 1' } : {}}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>{f.label}</label>
                    <input type={f.type} required={f.required} value={(form as Record<string,string>)[f.key]} onChange={e => set(f.key, e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>{L.grade}</label>
                  <select required value={form.gradeApplying} onChange={e => set('gradeApplying', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'auto' }}>
                    <option value="">--</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Parent */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '20px', fontSize: '1.1rem' }}>👨‍👩‍👧 {L.parentInfo}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: L.parentName, key: 'parentName', required: true },
                  { label: L.phone, key: 'parentPhone', required: true },
                  { label: L.email, key: 'parentEmail', required: false },
                  { label: L.address, key: 'address', required: false },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>{f.label}</label>
                    <input required={f.required} value={(form as Record<string,string>)[f.key]} onChange={e => set(f.key, e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>{L.notes}</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>

            {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '...' : `📤 ${L.submit}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
