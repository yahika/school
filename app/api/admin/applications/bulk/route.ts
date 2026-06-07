import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { ids, action } = await req.json()
    if (!ids?.length || !action) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    if (action === 'delete') {
      await prisma.application.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ success: true, affected: ids.length })
    }

    const status = action === 'accept' ? 'accepted' : 'rejected'
    await prisma.application.updateMany({ where: { id: { in: ids } }, data: { status } })

    // Send acceptance emails
    if (status === 'accepted' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const apps = await prisma.application.findMany({
        where: { id: { in: ids }, parentEmail: { not: null } },
        select: { parentEmail: true, parentName: true, studentNameAr: true, gradeApplying: true },
      })
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
      await Promise.allSettled(apps.map(app => app.parentEmail ? transporter.sendMail({
        from: `"أكاديمية النخبة" <${process.env.GMAIL_USER}>`,
        to: app.parentEmail,
        subject: `🎉 تهانينا! تم قبول طلب تسجيل ${app.studentNameAr}`,
        html: `<div dir="rtl" style="font-family:Arial;max-width:500px;padding:24px"><h2 style="color:#0a5c36">تهانينا ${app.parentName}! تم قبول طلب تسجيل ${app.studentNameAr} في الصف ${app.gradeApplying}.</h2><p>سيتواصل معكم فريق القبول قريباً.</p></div>`,
      }) : Promise.resolve()))
    }

    return NextResponse.json({ success: true, affected: ids.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
