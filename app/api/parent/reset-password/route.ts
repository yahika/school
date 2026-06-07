import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, seatNumber, newPassword } = await req.json()
    if (!email || !seatNumber || !newPassword)
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    if (newPassword.length < 6)
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })

    const parent = await prisma.parentAccount.findUnique({ where: { email } })
    if (!parent || parent.seatNumber !== seatNumber)
      return NextResponse.json({ error: 'البريد الإلكتروني أو رقم الجلوس غير صحيح' }, { status: 401 })

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.parentAccount.update({ where: { id: parent.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
