import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json()
    if (!name || !phone || !message)
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

    await prisma.contactMessage.create({ data: { name, email, phone, message } })

    // Notify admin
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        })
        await transporter.sendMail({
          from: `"أكاديمية النخبة" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `📬 رسالة جديدة من ${name}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;padding:24px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#0a5c36;margin:0 0 16px">📬 رسالة جديدة من الموقع</h2>
            <p><strong>الاسم:</strong> ${name}</p>
            <p><strong>الهاتف:</strong> ${phone}</p>
            ${email ? `<p><strong>البريد:</strong> ${email}</p>` : ''}
            <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-top:12px">
              <strong>الرسالة:</strong><br/><br/>${message}
            </div>
            <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px">يمكنك الرد من لوحة التحكم على <a href="/admin/messages">admin/messages</a></p>
          </div>`,
        })
      } catch (e) { console.error('Email notify failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
