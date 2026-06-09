import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

// Server component — renders a print-ready student enrollment certificate
export default async function CertificatePage({ params }: { params: { seat: string } }) {
  const student = await prisma.studentFile.findUnique({ where: { seatNumber: params.seat } })
  if (!student) notFound()

  const issueDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <html dir="rtl" lang="ar">
      <head>
        <meta charSet="utf-8" />
        <title>شهادة قيد — {student.nameAr}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Tajawal', sans-serif; background: #f5f5f0; }
          .page {
            width: 210mm; min-height: 297mm; margin: 0 auto;
            background: white; padding: 20mm 18mm;
            display: flex; flex-direction: column;
          }
          .school-header { text-align: center; border-bottom: 3px solid #0a5c36; padding-bottom: 14px; margin-bottom: 22px; }
          .school-logo { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#0a5c36,#0d7a45); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; }
          .school-name { font-size: 1.6rem; font-weight: 900; color: #063d22; }
          .school-sub  { font-size: 0.85rem; color: #64748b; margin-top: 3px; }
          .cert-title  { text-align: center; margin: 24px 0; }
          .cert-title h1 { font-size: 1.9rem; font-weight: 900; color: #0f172a; letter-spacing: 0.04em; }
          .cert-title .underline { width: 120px; height: 4px; background: linear-gradient(90deg,#c8972b,#e5b850); border-radius: 2px; margin: 8px auto 0; }
          .cert-body  { font-size: 1.05rem; line-height: 2.1; color: #1e293b; flex: 1; }
          .cert-body .highlight { font-weight: 900; color: #0a5c36; border-bottom: 1.5px dashed #0a5c3655; padding-bottom: 1px; }
          .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 22px 0; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px; background: #f8fafc; }
          .field-item  { display: flex; flex-direction: column; gap: 3px; }
          .field-label { font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .field-value { font-size: 0.98rem; font-weight: 800; color: #0f172a; }
          .seal-row    { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1.5px solid #e2e8f0; }
          .seal-box    { text-align: center; width: 140px; }
          .seal-circle { width: 80px; height: 80px; border-radius: 50%; border: 2.5px dashed #c8972b; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: #a07820; font-size: 1.6rem; }
          .seal-label  { font-size: 0.8rem; color: #64748b; }
          .sign-line   { width: 140px; height: 1.5px; background: #475569; margin-bottom: 6px; }
          .no-print    { position: fixed; top: 16px; left: 16px; }
          @media print {
            body { background: white; }
            .no-print { display: none !important; }
            .page { margin: 0; padding: 14mm 16mm; box-shadow: none; }
          }
        `}</style>
      </head>
      <body>
        {/* Print / Close buttons */}
        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} style={{ padding: '10px 22px', borderRadius: '8px', background: '#0a5c36', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
            🖨️ طباعة
          </button>
          <button onClick={() => window.close()} style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
            ✕ إغلاق
          </button>
        </div>

        <div className="page">
          {/* Header */}
          <div className="school-header">
            <div className="school-logo">🎓</div>
            <div className="school-name">الأكاديمية الأمريكية</div>
            <div className="school-sub">Alexandria American Academy · الإسكندرية</div>
          </div>

          {/* Certificate title */}
          <div className="cert-title">
            <h1>شهادة قيد وقبول</h1>
            <div className="underline" />
          </div>

          {/* Body text */}
          <div className="cert-body">
            <p>
              تشهد إدارة <span className="highlight">الأكاديمية الأمريكية بالإسكندرية</span> بأن الطالب / الطالبة:
            </p>

            <div className="fields-grid">
              <div className="field-item">
                <span className="field-label">الاسم بالكامل (عربي)</span>
                <span className="field-value">{student.nameAr}</span>
              </div>
              {student.nameEn && (
                <div className="field-item">
                  <span className="field-label">Full Name (English)</span>
                  <span className="field-value">{student.nameEn}</span>
                </div>
              )}
              <div className="field-item">
                <span className="field-label">رقم الجلوس</span>
                <span className="field-value">{student.seatNumber}</span>
              </div>
              <div className="field-item">
                <span className="field-label">الصف الدراسي</span>
                <span className="field-value">{student.gradeAr}</span>
              </div>
              {student.nationalId && (
                <div className="field-item">
                  <span className="field-label">الرقم القومي</span>
                  <span className="field-value">{student.nationalId}</span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="field-item">
                  <span className="field-label">تاريخ الميلاد</span>
                  <span className="field-value">{student.dateOfBirth}</span>
                </div>
              )}
              {student.enrollDate && (
                <div className="field-item">
                  <span className="field-label">تاريخ الالتحاق</span>
                  <span className="field-value">{student.enrollDate}</span>
                </div>
              )}
              <div className="field-item">
                <span className="field-label">حالة القيد</span>
                <span className="field-value" style={{ color: student.status === 'active' ? '#15803d' : '#64748b' }}>
                  {student.status === 'active' ? 'طالب منتظم مقيد بالمدرسة' : student.status}
                </span>
              </div>
            </div>

            <p style={{ marginTop: '16px' }}>
              وقد صدرت هذه الشهادة بناءً على طلب ولي الأمر لتقديمها <span className="highlight">لمن يلزم</span>،
              ولا تُعدّ وثيقة رسمية معتمدة خارج نطاق الأكاديمية.
            </p>
          </div>

          {/* Seal / Signature row */}
          <div className="seal-row">
            <div className="seal-box">
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '10px' }}>مدير المدرسة</div>
              <div className="sign-line" />
              <div className="seal-label">التوقيع والخاتم</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="seal-circle">🏫</div>
              <div className="seal-label">ختم المدرسة</div>
            </div>
            <div className="seal-box" style={{ textAlign: 'start' }}>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '6px' }}>تاريخ الإصدار</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{issueDate}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
