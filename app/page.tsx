'use client'

import { useState, useEffect } from 'react'
import type { Lang } from '@/lib/translations'

const content = {
  ar: {
    nav: {
      home: 'الرئيسية', results: 'النتائج', apply: 'التسجيل',
      news: 'الإعلانات', schedule: 'جدول الامتحانات', contact: 'تواصل معنا', admin: 'الإدارة', lang: 'English',
    },
    hero: {
      badge: 'مدرسة أمريكية معتمدة',
      title: 'أكاديمية النخبة بالإسكندرية',
      subtitle: 'نُعِدُّ جيلاً واثقاً بالعلم، متسلحاً بالقيم، قادراً على قيادة المستقبل.',
      ctaResults: 'استعلم عن نتيجتك',
      ctaApply: 'سجّل الآن',
    },
    stats: [
      { value: '+500', label: 'طالب وطالبة' },
      { value: '98%', label: 'نسبة النجاح' },
      { value: '20+', label: 'مادة دراسية' },
      { value: '15+', label: 'سنة خبرة' },
    ],
    about: {
      title: 'عن المدرسة',
      body: 'أكاديمية النخبة بالإسكندرية مدرسة خاصة تُقدّم مناهج أمريكية معتمدة باللغتين العربية والإنجليزية. نؤمن بأن التعليم الحقيقي يُنمّي العقل والشخصية معاً، ونحرص على تهيئة بيئة تعليمية متميزة تُعِدُّ الطالب لمواجهة تحديات العصر بثقة واقتدار.',
      vision: 'رؤيتنا',
      visionText: 'أن نكون المرجع التعليمي الأول في الإسكندرية، بتقديم تعليم عالمي المستوى يُخرّج قادةً المستقبل.',
      mission: 'رسالتنا',
      missionText: 'تمكين كل طالب بالمعرفة والمهارات والقيم التي تُؤهله للنجاح في عالم متغير.',
    },
    features: [
      { icon: '📚', title: 'مناهج أمريكية', desc: 'مناهج معتمدة دولياً تجمع بين الأصالة والمعاصرة' },
      { icon: '🌍', title: 'ثنائية اللغة', desc: 'تعليم متكامل باللغتين العربية والإنجليزية' },
      { icon: '🎓', title: 'كوادر متميزة', desc: 'هيئة تدريسية مؤهلة ذات خبرة واسعة' },
      { icon: '💻', title: 'تقنية حديثة', desc: 'بيئة تعليمية رقمية متطورة' },
      { icon: '🏆', title: 'نتائج متفوقة', desc: 'سجل حافل من التفوق والإنجاز الأكاديمي' },
      { icon: '🤝', title: 'شراكة أسرية', desc: 'تواصل مستمر مع أولياء الأمور' },
    ],
    news: {
      title: 'آخر الأخبار',
      items: [
        { date: 'يونيو 2026', title: 'نتائج الفصل الدراسي الثاني متاحة الآن', desc: 'يمكن للطلاب الاستعلام عن نتائجهم من خلال بوابة النتائج الإلكترونية.' },
        { date: 'مايو 2026', title: 'حفل تخرج الدفعة الثانية عشرة', desc: 'تحتفل الأكاديمية بتخريج دفعة جديدة من طلابها المتميزين.' },
        { date: 'أبريل 2026', title: 'افتتاح مختبر العلوم الجديد', desc: 'تم تجهيز مختبر علوم متطور لخدمة الطلاب في مراحل الدراسة المختلفة.' },
      ],
    },
    apply: {
      title: 'انضم إلى عائلتنا',
      subtitle: 'نُرحّب بالطلاب الجدد لكل المراحل الدراسية. سجّل الآن واحجز مقعدك.',
      btn: 'قدّم طلب التسجيل',
      note: 'التسجيل متاح طوال العام — سنتواصل معك خلال 48 ساعة',
    },
    contact: {
      title: 'تواصل معنا',
      address: 'الإسكندرية، مصر',
      phone: '010 0000 0000',
      email: 'info@academy.edu.eg',
      hours: 'السبت – الخميس: 8 صباحاً – 4 مساءً',
    },
    footer: 'جميع الحقوق محفوظة © 2026 أكاديمية النخبة بالإسكندرية',
  },
  en: {
    nav: {
      home: 'Home', results: 'Results', apply: 'Apply',
      news: 'Announcements', schedule: 'Exam Schedule', contact: 'Contact', admin: 'Admin', lang: 'عربي',
    },
    hero: {
      badge: 'Accredited American School',
      title: 'Alexandria Elite Academy',
      subtitle: 'Empowering students with knowledge, values, and the confidence to lead the future.',
      ctaResults: 'View Your Results',
      ctaApply: 'Apply Now',
    },
    stats: [
      { value: '500+', label: 'Students' },
      { value: '98%', label: 'Pass Rate' },
      { value: '20+', label: 'Subjects' },
      { value: '15+', label: 'Years of Excellence' },
    ],
    about: {
      title: 'About Us',
      body: 'Alexandria Elite Academy is a private school offering accredited American curricula in both Arabic and English. We believe that true education develops the mind and character together, providing a distinguished learning environment that prepares students to face the challenges of the modern world.',
      vision: 'Our Vision',
      visionText: 'To be the leading educational institution in Alexandria, delivering world-class education that graduates future leaders.',
      mission: 'Our Mission',
      missionText: 'To empower every student with the knowledge, skills, and values needed to succeed in a changing world.',
    },
    features: [
      { icon: '📚', title: 'American Curriculum', desc: 'Internationally accredited curricula blending tradition and modernity' },
      { icon: '🌍', title: 'Bilingual Education', desc: 'Comprehensive instruction in both Arabic and English' },
      { icon: '🎓', title: 'Expert Faculty', desc: 'Highly qualified teaching staff with extensive experience' },
      { icon: '💻', title: 'Modern Technology', desc: 'Advanced digital learning environment' },
      { icon: '🏆', title: 'Outstanding Results', desc: 'A proud record of academic excellence and achievement' },
      { icon: '🤝', title: 'Family Partnership', desc: 'Continuous communication with parents and guardians' },
    ],
    news: {
      title: 'Latest News',
      items: [
        { date: 'June 2026', title: 'Second Semester Results Now Available', desc: 'Students can check their results through the online results portal.' },
        { date: 'May 2026', title: 'Graduation Ceremony — Class of 2026', desc: 'The Academy celebrates the graduation of another distinguished class.' },
        { date: 'April 2026', title: 'New Science Laboratory Opens', desc: 'A state-of-the-art science lab has been equipped to serve students across all grade levels.' },
      ],
    },
    apply: {
      title: 'Join Our Family',
      subtitle: 'We welcome new students for all grade levels. Apply now and reserve your seat.',
      btn: 'Submit Application',
      note: 'Enrollment open year-round — we will contact you within 48 hours',
    },
    contact: {
      title: 'Contact Us',
      address: 'Alexandria, Egypt',
      phone: '010 0000 0000',
      email: 'info@academy.edu.eg',
      hours: 'Sat – Thu: 8:00 AM – 4:00 PM',
    },
    footer: 'All Rights Reserved © 2026 Alexandria Elite Academy',
  },
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ar')
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

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,92,54,0.97)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#c8972b,#a07820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.75rem', color: 'white',
          }}>AEA</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{L.hero.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            { label: L.nav.results, href: '/results' },
            { label: L.nav.apply, href: '/apply' },
            { label: L.nav.news, href: '/news' },
            { label: L.nav.schedule, href: '/schedule' },
            { label: L.nav.contact, href: '#contact' },
          ].map(link => (
            <a key={link.href} href={link.href} style={{
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{link.label}</a>
          ))}
          <button onClick={toggleLang} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '999px', padding: '5px 12px',
            fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>🌐 {L.nav.lang}</button>
          <a href="/admin/login" style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '5px 12px',
            fontSize: '0.78rem', textDecoration: 'none',
          }}>{L.nav.admin}</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #063d22 0%, #0a5c36 50%, #0d7a45 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 40%, rgba(200,151,43,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(200,151,43,0.2)',
            border: '1px solid rgba(200,151,43,0.4)', borderRadius: '999px',
            padding: '6px 20px', marginBottom: '24px',
          }}>
            <span style={{ color: '#e5b850', fontSize: '0.85rem', fontWeight: 600 }}>✦ {L.hero.badge}</span>
          </div>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg,#c8972b,#a07820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.3rem', color: 'white',
            boxShadow: '0 8px 32px rgba(200,151,43,0.3)',
          }}>AEA</div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            {L.hero.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(1rem,2vw,1.2rem)', margin: '0 0 40px', lineHeight: 1.7 }}>
            {L.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/results" style={{
              background: 'linear-gradient(135deg,#c8972b,#a07820)', color: 'white',
              padding: '14px 32px', borderRadius: '999px', textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 20px rgba(200,151,43,0.4)',
            }}>🔍 {L.hero.ctaResults}</a>
            <a href="/apply" style={{
              background: 'rgba(255,255,255,0.12)', color: 'white', border: '2px solid rgba(255,255,255,0.3)',
              padding: '14px 32px', borderRadius: '999px', textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem',
            }}>📝 {L.hero.ctaApply}</a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'white', padding: '48px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '32px', textAlign: 'center' }}>
          {L.stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0a5c36' }}>{s.value}</div>
              <div style={{ color: '#64748b', fontWeight: 500, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 800, fontSize: '2rem', textAlign: 'center', marginBottom: '48px' }}>
            {L.about.title}
          </h2>
          <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.9, textAlign: 'center', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px' }}>
            {L.about.body}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              { title: L.about.vision, text: L.about.visionText, icon: '🌟' },
              { title: L.about.mission, text: L.about.missionText, icon: '🎯' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'white', borderRadius: '16px', padding: '32px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon}</div>
                <h3 style={{ color: '#0a5c36', fontWeight: 700, marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: '#64748b', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 800, fontSize: '2rem', textAlign: 'center', marginBottom: '48px' }}>
            {lang === 'ar' ? 'لماذا نخبة؟' : 'Why Elite?'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '24px' }}>
            {L.features.map(f => (
              <div key={f.title} style={{
                background: '#f8fafc', borderRadius: '16px', padding: '28px',
                border: '1px solid #e2e8f0', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 800, fontSize: '2rem', textAlign: 'center', marginBottom: '48px' }}>
            {L.news.title}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '24px' }}>
            {L.news.items.map(item => (
              <div key={item.title} style={{
                background: 'white', borderRadius: '16px', padding: '28px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  display: 'inline-block', background: '#f0fdf4', color: '#0a5c36',
                  fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px',
                  borderRadius: '999px', marginBottom: '12px', border: '1px solid #bbf7d0',
                }}>{item.date}</div>
                <h3 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '8px', fontSize: '1rem', lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLY CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #063d22, #0a5c36)',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '2rem', marginBottom: '16px' }}>{L.apply.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', marginBottom: '32px', lineHeight: 1.7 }}>{L.apply.subtitle}</p>
          <a href="/apply" style={{
            background: 'linear-gradient(135deg,#c8972b,#a07820)', color: 'white',
            padding: '16px 40px', borderRadius: '999px', textDecoration: 'none',
            fontWeight: 700, fontSize: '1.1rem', display: 'inline-block',
            boxShadow: '0 4px 20px rgba(200,151,43,0.4)',
          }}>📝 {L.apply.btn}</a>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '16px' }}>{L.apply.note}</p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#0a5c36', fontWeight: 800, fontSize: '2rem', marginBottom: '48px' }}>{L.contact.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '32px' }}>
            {[
              { icon: '📍', label: L.contact.address },
              { icon: '📞', label: L.contact.phone },
              { icon: '✉️', label: L.contact.email },
              { icon: '🕐', label: L.contact.hours },
            ].map(item => (
              <div key={item.label} style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon}</div>
                <div style={{ color: '#475569', fontWeight: 500, lineHeight: 1.6 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#063d22', color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', padding: '24px', fontSize: '0.85rem',
      }}>
        {L.footer}
      </footer>

    </div>
  )
}
