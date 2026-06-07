'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Lang } from '@/lib/translations'

const content = {
  ar: {
    nav: { home: 'الرئيسية', results: 'النتائج', apply: 'التسجيل', news: 'الإعلانات', schedule: 'جدول الامتحانات', contact: 'تواصل', admin: 'الإدارة', lang: 'English' },
    hero: {
      badge: '🎓 مدرسة أمريكية معتمدة دولياً',
      title: 'أكاديمية النخبة', titleSub: 'بالإسكندرية',
      subtitle: 'نُعِدُّ جيلاً واثقاً بالعلم، متسلحاً بالقيم، قادراً على قيادة المستقبل.',
      ctaResults: 'استعلم عن نتيجتك', ctaApply: 'سجّل الآن',
    },
    stats: [
      { value: '500+', label: 'طالب وطالبة', icon: '👨‍🎓' },
      { value: '98%', label: 'نسبة النجاح', icon: '🏆' },
      { value: '20+', label: 'مادة دراسية', icon: '📚' },
      { value: '15+', label: 'سنة خبرة', icon: '⭐' },
    ],
    about: {
      title: 'عن أكاديميتنا', subtitle: 'نبني شخصية قبل أن نبني عقلاً',
      body: 'أكاديمية النخبة بالإسكندرية مدرسة خاصة تُقدّم مناهج أمريكية معتمدة باللغتين العربية والإنجليزية. نؤمن بأن التعليم الحقيقي يُنمّي العقل والشخصية معاً، ونحرص على تهيئة بيئة تعليمية متميزة تُعِدُّ الطالب لمواجهة تحديات العصر بثقة واقتدار.',
      vision: 'رؤيتنا', visionText: 'أن نكون المرجع التعليمي الأول في الإسكندرية، بتقديم تعليم عالمي المستوى يُخرّج قادة المستقبل.',
      mission: 'رسالتنا', missionText: 'تمكين كل طالب بالمعرفة والمهارات والقيم التي تُؤهله للنجاح في عالم متغير.',
      values: 'قيمنا', valuesText: 'التميز، النزاهة، الاحترام، الإبداع — مبادئ راسخة في كل جانب من جوانب حياتنا المدرسية.',
    },
    features: [
      { icon: '📚', title: 'مناهج أمريكية', desc: 'مناهج معتمدة دولياً تجمع بين الأصالة والمعاصرة' },
      { icon: '🌍', title: 'ثنائية اللغة', desc: 'تعليم متكامل باللغتين العربية والإنجليزية' },
      { icon: '🎓', title: 'كوادر متميزة', desc: 'هيئة تدريسية مؤهلة ذات خبرة واسعة' },
      { icon: '💻', title: 'تقنية حديثة', desc: 'بيئة تعليمية رقمية متطورة' },
      { icon: '🏆', title: 'نتائج متفوقة', desc: 'سجل حافل من التفوق والإنجاز الأكاديمي' },
      { icon: '🤝', title: 'شراكة أسرية', desc: 'تواصل مستمر مع أولياء الأمور' },
    ],
    programs: [
      { grade: 'KG1 – KG2', title: 'مرحلة الروضة', desc: 'بيئة آمنة وإبداعية تُحفّز الفضول وتُنمّي المهارات الأساسية', color: '#fef9c3', border: '#fde047' },
      { grade: 'الصف 1 – 6', title: 'المرحلة الابتدائية', desc: 'أساس أكاديمي متين مع تركيز على اللغتين والعلوم والرياضيات', color: '#dbeafe', border: '#60a5fa' },
      { grade: 'الصف 7 – 9', title: 'المرحلة الإعدادية', desc: 'تعميق المعرفة وتطوير مهارات التفكير النقدي والتحليلي', color: '#dcfce7', border: '#4ade80' },
      { grade: 'الصف 10 – 12', title: 'المرحلة الثانوية', desc: 'إعداد متكامل للجامعة مع توجيه أكاديمي ومهني متخصص', color: '#fce7f3', border: '#f472b6' },
    ],
    news: { title: 'آخر الأخبار والإعلانات', subtitle: 'ابقَ على اطلاع بكل جديد', more: 'عرض كل الإعلانات', empty: 'لا توجد إعلانات حالياً' },
    gallery: {
      title: 'لحظات من حياتنا المدرسية',
      subtitle: 'تعلّم، نمو، وذكريات لا تُنسى',
      items: ['🏫 مبنى الأكاديمية', '🔬 مختبر العلوم', '📖 مكتبة الطلاب', '⚽ الملعب الرياضي', '🎨 قاعة الفنون', '💻 مختبر الحاسوب'],
    },
    apply: {
      title: 'انضم إلى عائلة النخبة', subtitle: 'نُرحّب بالطلاب الجدد لكل المراحل الدراسية. سجّل الآن واحجز مقعدك.',
      btn: 'قدّم طلب التسجيل', note: 'التسجيل متاح طوال العام — سنتواصل معك خلال 48 ساعة',
      features: ['✓ قبول سريع خلال 48 ساعة', '✓ اختبار تحديد المستوى مجاني', '✓ جولة في المدرسة عند الطلب'],
    },
    contact: {
      title: 'تواصل معنا', subtitle: 'نحن هنا للإجابة على كل استفساراتكم',
      address: 'الإسكندرية، مصر', phone: '010 0000 0000', email: 'info@academy.edu.eg',
      hours: 'السبت – الخميس: 8 صباحاً – 4 مساءً', whatsapp: 'واتساب',
    },
    footer: {
      copy: 'جميع الحقوق محفوظة © 2026 أكاديمية النخبة بالإسكندرية',
      links: [
        { label: 'النتائج', href: '/results' }, { label: 'التسجيل', href: '/apply' },
        { label: 'الإعلانات', href: '/news' }, { label: 'جدول الامتحانات', href: '/schedule' },
        { label: 'بوابة الأهل', href: '/parent/login' },
      ],
    },
  },
  en: {
    nav: { home: 'Home', results: 'Results', apply: 'Apply', news: 'Announcements', schedule: 'Exam Schedule', contact: 'Contact', admin: 'Admin', lang: 'عربي' },
    hero: {
      badge: '🎓 Internationally Accredited American School',
      title: 'Alexandria Elite', titleSub: 'Academy',
      subtitle: 'Empowering students with knowledge, values, and the confidence to lead the future.',
      ctaResults: 'View Your Results', ctaApply: 'Apply Now',
    },
    stats: [
      { value: '500+', label: 'Students', icon: '👨‍🎓' },
      { value: '98%', label: 'Pass Rate', icon: '🏆' },
      { value: '20+', label: 'Subjects', icon: '📚' },
      { value: '15+', label: 'Years of Excellence', icon: '⭐' },
    ],
    about: {
      title: 'About Our Academy', subtitle: 'Building Character Before Building Minds',
      body: 'Alexandria Elite Academy is a private school offering accredited American curricula in both Arabic and English. We believe that true education develops the mind and character together, providing a distinguished learning environment that prepares students to face the challenges of the modern world.',
      vision: 'Our Vision', visionText: 'To be the leading educational institution in Alexandria, delivering world-class education that graduates future leaders.',
      mission: 'Our Mission', missionText: 'To empower every student with the knowledge, skills, and values needed to succeed in a changing world.',
      values: 'Our Values', valuesText: 'Excellence, Integrity, Respect, Innovation — principles embedded in every aspect of our school life.',
    },
    features: [
      { icon: '📚', title: 'American Curriculum', desc: 'Internationally accredited curricula blending tradition and modernity' },
      { icon: '🌍', title: 'Bilingual Education', desc: 'Comprehensive instruction in both Arabic and English' },
      { icon: '🎓', title: 'Expert Faculty', desc: 'Highly qualified teaching staff with extensive experience' },
      { icon: '💻', title: 'Modern Technology', desc: 'Advanced digital learning environment' },
      { icon: '🏆', title: 'Outstanding Results', desc: 'A proud record of academic excellence and achievement' },
      { icon: '🤝', title: 'Family Partnership', desc: 'Continuous communication with parents and guardians' },
    ],
    programs: [
      { grade: 'KG1 – KG2', title: 'Kindergarten', desc: 'A safe and creative environment that sparks curiosity and builds foundational skills', color: '#fef9c3', border: '#fde047' },
      { grade: 'Grades 1 – 6', title: 'Primary School', desc: 'A strong academic foundation with focus on languages, science, and mathematics', color: '#dbeafe', border: '#60a5fa' },
      { grade: 'Grades 7 – 9', title: 'Middle School', desc: 'Deepening knowledge and developing critical and analytical thinking skills', color: '#dcfce7', border: '#4ade80' },
      { grade: 'Grades 10 – 12', title: 'High School', desc: 'Comprehensive university preparation with specialized academic and career guidance', color: '#fce7f3', border: '#f472b6' },
    ],
    news: { title: 'Latest News & Announcements', subtitle: 'Stay up to date with everything happening', more: 'View All Announcements', empty: 'No announcements yet' },
    gallery: {
      title: 'Moments from Our School Life',
      subtitle: 'Learning, Growth, and Unforgettable Memories',
      items: ['🏫 Academy Building', '🔬 Science Lab', '📖 Student Library', '⚽ Sports Field', '🎨 Arts Room', '💻 Computer Lab'],
    },
    apply: {
      title: 'Join the Elite Family', subtitle: 'We welcome new students for all grade levels. Apply now and reserve your seat.',
      btn: 'Submit Application', note: 'Enrollment open year-round — we will contact you within 48 hours',
      features: ['✓ Fast acceptance within 48 hours', '✓ Free placement test', '✓ School tour on request'],
    },
    contact: {
      title: 'Contact Us', subtitle: 'We are here to answer all your questions',
      address: 'Alexandria, Egypt', phone: '010 0000 0000', email: 'info@academy.edu.eg',
      hours: 'Sat – Thu: 8:00 AM – 4:00 PM', whatsapp: 'WhatsApp',
    },
    footer: {
      copy: 'All Rights Reserved © 2026 Alexandria Elite Academy',
      links: [
        { label: 'Results', href: '/results' }, { label: 'Apply', href: '/apply' },
        { label: 'Announcements', href: '/news' }, { label: 'Exam Schedule', href: '/schedule' },
        { label: 'Parent Portal', href: '/parent/login' },
      ],
    },
  },
}

interface Announcement { id: number; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; publishedAt: string }

function ContactForm({ lang, isRtl }: { lang: 'ar'|'en'; isRtl: boolean }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const L = lang === 'ar'
    ? { title: 'أرسل لنا رسالة', name: 'الاسم *', phone: 'رقم الهاتف *', email: 'البريد الإلكتروني', message: 'رسالتك *', btn: 'إرسال الرسالة', ok: '✅ تم الإرسال! سنتواصل معك قريباً.' }
    : { title: 'Send Us a Message', name: 'Full Name *', phone: 'Phone Number *', email: 'Email Address', message: 'Your Message *', btn: 'Send Message', ok: '✅ Sent! We will contact you soon.' }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch { setErr(lang === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Something went wrong, please try again') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
      <div style={{ fontWeight: 700, color: '#15803d', fontSize: '1rem' }}>{L.ok}</div>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ color: '#0a5c36', fontWeight: 800, marginBottom: '24px', fontSize: '1.1rem' }}>{L.title}</h3>
      <form onSubmit={submit}>
        {[
          { label: L.name, key: 'name', type: 'text', required: true },
          { label: L.phone, key: 'phone', type: 'tel', required: true },
          { label: L.email, key: 'email', type: 'email', required: false },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{f.label}</label>
            <input type={f.type} required={f.required} value={(form as Record<string,string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', background: 'white', transition: 'border 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        ))}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151' }}>{L.message}</label>
          <textarea required rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', background: 'white', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#0a5c36'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </div>
        {err && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{err}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#0a5c36,#0d7a45)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : `📤 ${L.btn}`}
        </button>
      </form>
    </div>
  )
}

function useCountUp(target: string, trigger: boolean) {
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    if (!trigger) return
    const num = parseInt(target.replace(/\D/g, ''))
    if (!num) { setDisplay(target); return }
    let start = 0
    const step = Math.ceil(num / 40)
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setDisplay(target); clearInterval(timer) }
      else setDisplay(target.replace(/\d+/, String(start)))
    }, 30)
    return () => clearInterval(timer)
  }, [trigger, target])
  return display
}

function StatCard({ value, label, icon, trigger }: { value: string; label: string; icon: string; trigger: boolean }) {
  const display = useCountUp(value, trigger)
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0a5c36', lineHeight: 1 }}>{display}</div>
      <div style={{ color: '#64748b', fontWeight: 600, marginTop: '8px', fontSize: '0.95rem' }}>{label}</div>
    </div>
  )
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [menuOpen, setMenuOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const L = content[lang]
  const isRtl = lang === 'ar'

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored) setLang(stored)
  }, [])

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRtl])

  useEffect(() => {
    fetch('/api/announcements').then(r => r.json()).then(d => setAnnouncements((d.announcements ?? []).slice(0, 3)))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .hero-float { animation: float 6s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .nav-link:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(10,92,54,0.12) !important; }
        .program-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1) !important; }
        .gallery-card:hover { transform: scale(1.03); }
        .gold-gradient { background: linear-gradient(135deg, #c8972b, #e5b850); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
          .nav-title-desktop div:last-child { display: none; }
        }
        @media (max-width: 640px) {
          section { padding-left: 16px !important; padding-right: 16px !important; }
          .hero-btns { flex-direction: column !important; align-items: center; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .programs-grid { grid-template-columns: 1fr 1fr !important; }
          .gallery-grid { grid-template-columns: 1fr 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(6,61,34,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'white', boxShadow: '0 4px 12px rgba(200,151,43,0.4)', flexShrink: 0 }}>AEA</div>
          <div className="nav-title-desktop">
            <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>{isRtl ? 'أكاديمية النخبة' : 'Alexandria Elite'}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>{isRtl ? 'بالإسكندرية' : 'Academy'}</div>
          </div>
        </a>

        {/* Desktop links */}
        <div className="nav-desktop" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[
            { label: L.nav.results, href: '/results' },
            { label: L.nav.apply, href: '/apply' },
            { label: L.nav.news, href: '/news' },
            { label: L.nav.schedule, href: '/schedule' },
            { label: L.nav.contact, href: '#contact' },
            { label: isRtl ? 'بوابة الأهل' : 'Parent Portal', href: '/parent/login' },
          ].map(link => (
            <a key={link.href} href={link.href} className="nav-link" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.83rem', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>{link.label}</a>
          ))}
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
          <button onClick={toggleLang} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>🌐 {L.nav.lang}</button>
          <a href="/admin/login" style={{ background: 'rgba(200,151,43,0.15)', border: '1px solid rgba(200,151,43,0.3)', color: '#e5b850', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>{L.nav.admin}</a>
        </div>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'white', fontSize: '1.4rem' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 999, background: 'rgba(6,61,34,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { label: L.nav.results, href: '/results' },
            { label: L.nav.apply, href: '/apply' },
            { label: L.nav.news, href: '/news' },
            { label: L.nav.schedule, href: '/schedule' },
            { label: L.nav.contact, href: '#contact' },
            { label: isRtl ? 'بوابة الأهل' : 'Parent Portal', href: '/parent/login' },
            { label: L.nav.admin, href: '/admin/login' },
          ].map(link => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '12px 16px', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', display: 'block' }}>{link.label}</a>
          ))}
          <button onClick={() => { toggleLang(); setMenuOpen(false) }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '12px 16px', borderRadius: '10px', fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, marginTop: '4px' }}>
            🌐 {L.nav.lang}
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #041f12 0%, #063d22 40%, #0a5c36 70%, #0d6b40 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,151,43,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,122,69,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Floating dots */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${15 + (i * 11) % 70}%`,
            left: `${5 + (i * 13) % 90}%`,
            width: i % 3 === 0 ? '6px' : '4px', height: i % 3 === 0 ? '6px' : '4px',
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(200,151,43,0.5)' : 'rgba(255,255,255,0.15)',
            animation: `float ${4 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
          {/* Badge */}
          <div className="fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(200,151,43,0.15)', border: '1px solid rgba(200,151,43,0.35)',
            borderRadius: '999px', padding: '8px 24px', marginBottom: '32px',
          }}>
            <span style={{ color: '#e5b850', fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.02em' }}>{L.hero.badge}</span>
          </div>

          {/* Logo */}
          <div className="hero-float" style={{
            width: '90px', height: '90px', borderRadius: '20px', margin: '0 auto 28px',
            background: 'linear-gradient(135deg,#c8972b,#a07820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.4rem', color: 'white',
            boxShadow: '0 12px 40px rgba(200,151,43,0.35)',
          }}>AEA</div>

          {/* Title */}
          <h1 style={{ margin: '0 0 12px', lineHeight: 1.1 }}>
            <span style={{ display: 'block', color: 'white', fontSize: 'clamp(2.2rem,6vw,4rem)', fontWeight: 900 }}>
              {L.hero.title}
            </span>
            <span className="gold-gradient" style={{ display: 'block', fontSize: 'clamp(2.2rem,6vw,4rem)', fontWeight: 900 }}>
              {L.hero.titleSub}
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1rem,2vw,1.2rem)', margin: '20px auto 44px', lineHeight: 1.8, maxWidth: '580px' }}>
            {L.hero.subtitle}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/results" style={{
              background: 'linear-gradient(135deg,#c8972b,#b8831f)', color: 'white',
              padding: '16px 36px', borderRadius: '999px', textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 24px rgba(200,151,43,0.4)',
              transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>🔍 {L.hero.ctaResults}</a>
            <a href="/apply" style={{
              background: 'rgba(255,255,255,0.08)', color: 'white',
              border: '2px solid rgba(255,255,255,0.25)',
              padding: '16px 36px', borderRadius: '999px', textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>📝 {L.hero.ctaApply}</a>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', animation: 'pulse 2s infinite' }}>
            ↓ {isRtl ? 'اكتشف المزيد' : 'Discover more'}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{
        background: 'white',
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {L.stats.map((s, i) => (
            <div key={s.label} style={{
              borderRight: isRtl ? 'none' : (i < 3 ? '1px solid #f1f5f9' : 'none'),
              borderLeft: isRtl ? (i < 3 ? '1px solid #f1f5f9' : 'none') : 'none',
            }}>
              <StatCard value={s.value} label={s.label} icon={s.icon} trigger={statsVisible} />
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '6px 20px', marginBottom: '16px' }}>
              <span style={{ color: '#0a5c36', fontSize: '0.82rem', fontWeight: 700 }}>✦ {isRtl ? 'من نحن' : 'WHO WE ARE'}</span>
            </div>
            <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.6rem)', marginBottom: '12px' }}>{L.about.title}</h2>
            <p style={{ color: '#c8972b', fontWeight: 600, fontSize: '1.1rem' }}>{L.about.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '64px' }}>
            <div>
              <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 2, marginBottom: '24px' }}>{L.about.body}</p>
              <a href="/apply" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#0a5c36', color: 'white', padding: '12px 28px',
                borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
              }}>
                {isRtl ? 'سجّل الآن ←' : 'Apply Now →'}
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: L.about.vision, text: L.about.visionText, icon: '🌟', color: '#fef9c3', border: '#fde047' },
                { title: L.about.mission, text: L.about.missionText, icon: '🎯', color: '#dbeafe', border: '#93c5fd' },
                { title: L.about.values, text: L.about.valuesText, icon: '💎', color: '#f0fdf4', border: '#86efac' },
              ].map(item => (
                <div key={item.title} style={{
                  background: item.color, borderRadius: '14px', padding: '20px 24px',
                  border: `1px solid ${item.border}`, transition: 'transform 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{item.title}</span>
                  </div>
                  <p style={{ color: '#475569', margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section style={{ background: '#0a5c36', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '12px' }}>
              {isRtl ? 'برامجنا الأكاديمية' : 'Academic Programs'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
              {isRtl ? 'من الروضة حتى الثانوية — رحلة تعليمية متكاملة' : 'From Kindergarten to High School — A Complete Educational Journey'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            {L.programs.map(p => (
              <div key={p.grade} className="program-card" style={{
                background: p.color, borderRadius: '16px', padding: '28px 24px',
                border: `2px solid ${p.border}`, transition: 'all 0.25s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}>
                <div style={{ background: p.border, borderRadius: '8px', display: 'inline-block', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>{p.grade}</div>
                <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem', marginBottom: '10px' }}>{p.title}</h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ background: 'white', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '12px' }}>
              {isRtl ? 'لماذا تختار النخبة؟' : 'Why Choose Elite?'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              {isRtl ? 'ما يجعلنا مختلفين عن البقية' : 'What makes us different from the rest'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {L.features.map(f => (
              <div key={f.title} className="feature-card" style={{
                background: '#f8fafc', borderRadius: '18px', padding: '32px 28px',
                border: '1px solid #e2e8f0', transition: 'all 0.25s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                  border: '1px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', marginBottom: '18px',
                }}>{f.icon}</div>
                <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '10px', fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE ANNOUNCEMENTS ── */}
      <section style={{ background: 'linear-gradient(180deg,#f8fafc,#f0fdf4)', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '6px 20px', marginBottom: '14px' }}>
                <span style={{ color: '#0a5c36', fontSize: '0.82rem', fontWeight: 700 }}>✦ {isRtl ? 'مباشر من الأكاديمية' : 'LIVE FROM THE ACADEMY'}</span>
              </div>
              <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2.2rem)', margin: 0 }}>{L.news.title}</h2>
              <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.95rem' }}>{L.news.subtitle}</p>
            </div>
            <a href="/news" style={{
              background: '#0a5c36', color: 'white', padding: '10px 24px',
              borderRadius: '999px', textDecoration: 'none', fontWeight: 700,
              fontSize: '0.85rem', whiteSpace: 'nowrap',
            }}>{L.news.more} →</a>
          </div>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
              {L.news.empty}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
              {announcements.map((a, i) => (
                <div key={a.id} style={{
                  background: 'white', borderRadius: '20px', padding: '32px',
                  border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  borderTop: `4px solid ${i === 0 ? '#c8972b' : i === 1 ? '#0a5c36' : '#3b82f6'}`,
                  transition: 'transform 0.2s',
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 600 }}>
                    {new Date(a.publishedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '12px', fontSize: '1rem', lineHeight: 1.5 }}>
                    {lang === 'ar' ? a.titleAr : a.titleEn}
                  </h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem', lineHeight: 1.8 }}>
                    {(lang === 'ar' ? a.bodyAr : a.bodyEn).slice(0, 120)}{(lang === 'ar' ? a.bodyAr : a.bodyEn).length > 120 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section style={{ background: '#0f172a', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '12px' }}>{L.gallery.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>{L.gallery.subtitle}</p>
          </div>
          {/* Row 1: 2 wide cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {L.gallery.items.slice(0, 2).map((item, i) => (
              <div key={i} className="gallery-card" style={{
                background: `linear-gradient(135deg, ${['#063d22','#1e3a5f'][i]}, ${['#0d7a45','#2563eb'][i]})`,
                borderRadius: '20px', padding: '56px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '14px' }}>{item.split(' ')[0]}</div>
                <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '1rem' }}>{item.slice(item.indexOf(' ') + 1)}</div>
              </div>
            ))}
          </div>
          {/* Row 2: 3 equal cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {L.gallery.items.slice(2, 5).map((item, i) => (
              <div key={i} className="gallery-card" style={{
                background: `linear-gradient(135deg, ${['#4a1d60','#7c1d1d','#1d4a3a'][i]}, ${['#7c3aed','#dc2626','#059669'][i]})`,
                borderRadius: '20px', padding: '40px 16px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{item.split(' ')[0]}</div>
                <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '0.9rem' }}>{item.slice(item.indexOf(' ') + 1)}</div>
              </div>
            ))}
          </div>
          {/* Row 3: 1 full-width card */}
          {L.gallery.items[5] && (
            <div className="gallery-card" style={{
              background: 'linear-gradient(135deg,#3d2a0a,#b45309)',
              borderRadius: '20px', padding: '48px 24px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '14px' }}>{L.gallery.items[5].split(' ')[0]}</div>
              <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '1rem' }}>{L.gallery.items[5].slice(L.gallery.items[5].indexOf(' ') + 1)}</div>
            </div>
          )}
        </div>
      </section>

      {/* ── APPLY CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #041f12 0%, #063d22 50%, #0a5c36 100%)',
        padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(200,151,43,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(200,151,43,0.15)', border: '1px solid rgba(200,151,43,0.3)', borderRadius: '999px', padding: '6px 20px', marginBottom: '24px' }}>
            <span style={{ color: '#e5b850', fontSize: '0.82rem', fontWeight: 700 }}>✦ {isRtl ? 'التسجيل مفتوح الآن' : 'ENROLLMENT OPEN'}</span>
          </div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: '16px', lineHeight: 1.2 }}>{L.apply.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', marginBottom: '36px', lineHeight: 1.8 }}>{L.apply.subtitle}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
            {L.apply.features.map(f => (
              <span key={f} style={{ color: '#86efac', fontSize: '0.85rem', fontWeight: 600 }}>{f}</span>
            ))}
          </div>
          <a href="/apply" style={{
            background: 'linear-gradient(135deg,#c8972b,#b8831f)', color: 'white',
            padding: '18px 48px', borderRadius: '999px', textDecoration: 'none',
            fontWeight: 800, fontSize: '1.1rem', display: 'inline-block',
            boxShadow: '0 8px 32px rgba(200,151,43,0.4)',
          }}>📝 {L.apply.btn}</a>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginTop: '20px' }}>{L.apply.note}</p>
          <a href="/apply/status" style={{ display: 'inline-block', marginTop: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'underline' }}>
            {isRtl ? '🔍 تحقق من حالة طلبك' : '🔍 Check your application status'}
          </a>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: 'white', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '12px' }}>{L.contact.title}</h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>{L.contact.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            {/* Info cards */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {[
                  { icon: '📍', label: isRtl ? 'العنوان' : 'Address', value: L.contact.address, color: '#fef9c3', border: '#fde047' },
                  { icon: '📞', label: isRtl ? 'الهاتف' : 'Phone', value: L.contact.phone, color: '#dbeafe', border: '#93c5fd' },
                  { icon: '✉️', label: isRtl ? 'البريد' : 'Email', value: L.contact.email, color: '#f0fdf4', border: '#86efac' },
                  { icon: '🕐', label: isRtl ? 'ساعات العمل' : 'Hours', value: L.contact.hours, color: '#fce7f3', border: '#f9a8d4' },
                ].map(item => (
                  <div key={item.label} style={{ background: item.color, borderRadius: '14px', padding: '20px', border: `1px solid ${item.border}` }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <a href="https://wa.me/201000000000" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#25d366', color: 'white', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}>
                💬 {L.contact.whatsapp}
              </a>
            </div>

            {/* Contact form */}
            <ContactForm lang={lang} isRtl={isRtl} />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#041f12', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '48px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>AEA</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>{isRtl ? 'أكاديمية النخبة بالإسكندرية' : 'Alexandria Elite Academy'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{isRtl ? 'مدرسة أمريكية معتمدة' : 'Accredited American School'}</div>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', lineHeight: 1.8, maxWidth: '400px' }}>
                {isRtl ? 'نُعِدُّ جيلاً واثقاً بالعلم، متسلحاً بالقيم، قادراً على قيادة المستقبل.' : 'Empowering students with knowledge, values, and the confidence to lead the future.'}
              </p>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                {isRtl ? 'روابط سريعة' : 'Quick Links'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {L.footer.links.map(link => (
                  <a key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e5b850')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
            {L.footer.copy}
          </div>
        </div>
      </footer>
    </div>
  )
}
