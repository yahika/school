import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const app = await prisma.application.update({
    where: { id: parseInt(params.id) },
    data: { status },
  })

  // Send email to parent
  if (app.parentEmail && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = getTransporter()

      if (status === 'accepted') {
        await transporter.sendMail({
          from: `"أكاديمية النخبة بالإسكندرية" <${process.env.GMAIL_USER}>`,
          to: app.parentEmail,
          subject: `🎉 تهانينا! تم قبول طلب تسجيل ${app.studentNameAr}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
              <div style="background: linear-gradient(135deg, #063d22, #0a5c36); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎓 أكاديمية النخبة بالإسكندرية</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Alexandria Elite Academy</p>
              </div>
              <div style="background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #0a5c36; font-size: 22px; margin: 0 0 16px;">🎉 تهانينا، ${app.parentName}!</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 16px;">
                  يسعدنا إخبارك بأنه تم <strong>قبول طلب تسجيل</strong> الطالب/ة:
                </p>
                <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: #15803d;">${app.studentNameAr}</div>
                  ${app.studentNameEn ? `<div style="color: #64748b; font-size: 14px; margin-top: 4px;">${app.studentNameEn}</div>` : ''}
                  <div style="margin-top: 8px; color: #374151; font-size: 15px;">📚 الصف: <strong>${app.gradeApplying}</strong></div>
                </div>
                <p style="color: #374151; font-size: 15px; line-height: 1.8; margin: 16px 0 0;">
                  سيتواصل معكم فريق القبول قريباً لإكمال إجراءات التسجيل وتحديد موعد الاختبار التحديدي.
                </p>
                <p style="color: #374151; font-size: 15px; line-height: 1.8;">
                  إذا كان لديكم أي استفسار، لا تترددوا في التواصل معنا.
                </p>
              </div>
              <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 13px;">
                <p>جميع الحقوق محفوظة © 2026 أكاديمية النخبة بالإسكندرية</p>
              </div>
            </div>
          `,
        })
      }

      if (status === 'rejected') {
        await transporter.sendMail({
          from: `"أكاديمية النخبة بالإسكندرية" <${process.env.GMAIL_USER}>`,
          to: app.parentEmail,
          subject: `طلب تسجيل ${app.studentNameAr} — نتيجة المراجعة`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
              <div style="background: linear-gradient(135deg, #063d22, #0a5c36); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎓 أكاديمية النخبة بالإسكندرية</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Alexandria Elite Academy</p>
              </div>
              <div style="background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">عزيزي ${app.parentName}،</h2>
                <p style="color: #374151; font-size: 15px; line-height: 1.8;">
                  شكراً لتقديمكم طلب تسجيل الطالب/ة <strong>${app.studentNameAr}</strong> في أكاديميتنا.
                </p>
                <p style="color: #374151; font-size: 15px; line-height: 1.8;">
                  نأسف لإخبارككم بأننا لم نتمكن من قبول الطلب في الوقت الحالي نظراً لمحدودية الأماكن المتاحة.
                </p>
                <p style="color: #374151; font-size: 15px; line-height: 1.8;">
                  يسعدنا التواصل معكم للاطلاع على الخيارات المتاحة للعام الدراسي القادم.
                </p>
              </div>
              <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 13px;">
                <p>جميع الحقوق محفوظة © 2026 أكاديمية النخبة بالإسكندرية</p>
              </div>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }
  }

  return NextResponse.json({ application: app })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.application.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
