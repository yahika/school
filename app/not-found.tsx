import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#041f12,#063d22 50%,#0a5c36)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Tajawal, sans-serif', textAlign: 'center' }} dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap');`}</style>
      <div>
        <div style={{ fontSize: '8rem', fontWeight: 900, color: 'rgba(200,151,43,0.3)', lineHeight: 1, marginBottom: '8px' }}>404</div>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg,#c8972b,#a07820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1.1rem', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(200,151,43,0.4)' }}>AEA</div>
        <h1 style={{ color: 'white', fontWeight: 900, fontSize: '1.8rem', marginBottom: '12px' }}>الصفحة غير موجودة</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '32px' }}>عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#c8972b,#a07820)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 16px rgba(200,151,43,0.4)' }}>
            🏠 الرئيسية
          </Link>
          <Link href="/results" style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
            🔍 النتائج
          </Link>
        </div>
      </div>
    </div>
  )
}
