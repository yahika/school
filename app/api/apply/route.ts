import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentNameAr, studentNameEn, dateOfBirth, gradeApplying, parentName, parentPhone, parentEmail, address, notes } = body
    if (!studentNameAr || !dateOfBirth || !gradeApplying || !parentName || !parentPhone)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const app = await prisma.application.create({
      data: { studentNameAr, studentNameEn, dateOfBirth, gradeApplying, parentName, parentPhone, parentEmail, address, notes },
    })

    // Notify admin immediately
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        })
        await transporter.sendMail({
          from: `"أكاديمية النخبة" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `📝 طلب تسجيل جديد — ${studentNameAr}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;padding:24px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#0a5c36;margin:0 0 16px">📝 طلب تسجيل جديد</h2>
            <div style="background:white;padding:20px;border-radius:10px;border:1px solid #e2e8f0">
              <p><strong>اسم الطالب:</strong> ${studentNameAr}${studentNameEn ? ` / ${studentNameEn}` : ''}</p>
              <p><strong>الصف المطلوب:</strong> ${gradeApplying}</p>
              <p><strong>تاريخ الميلاد:</strong> ${dateOfBirth}</p>
              <p><strong>ولي الأمر:</strong> ${parentName}</p>
              <p><strong>الهاتف:</strong> ${parentPhone}</p>
              ${parentEmail ? `<p><strong>البريد:</strong> ${parentEmail}</p>` : ''}
              ${notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : ''}
            </div>
            <p style="color:#0a5c36;font-weight:600;margin-top:16px">رقم الطلب: #${app.id}</p>
            <p style="color:#94a3b8;font-size:0.8rem">يمكنك مراجعة الطلب من لوحة التحكم</p>
          </div>`,
        })
      } catch (e) { console.error('Admin notification failed:', e) }
    }

    return NextResponse.json({ success: true, id: app.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
