import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, seatNumber } = await req.json()

    if (!name || !email || !password || !seatNumber)
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })

    // Check seat number exists in results
    const result = await prisma.result.findFirst({
      where: { seatNumber },
      include: { semester: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!result)
      return NextResponse.json({ error: 'رقم الجلوس غير موجود — تأكد من الرقم أو تواصل مع الإدارة' }, { status: 404 })

    // Check email not already used
    const existing = await prisma.parentAccount.findUnique({ where: { email } })
    if (existing)
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const parent = await prisma.parentAccount.create({
      data: {
        name, email, password: hashed, phone,
        seatNumber,
        studentName: result.nameAr,
        gradeAr: result.gradeAr,
        gradeEn: result.gradeEn ?? '',
      },
    })

    return NextResponse.json({ success: true, parentId: parent.id, studentName: result.nameAr })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
