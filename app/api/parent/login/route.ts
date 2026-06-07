import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json({ error: 'أدخل البريد الإلكتروني وكلمة المرور' }, { status: 400 })

    const parent = await prisma.parentAccount.findUnique({ where: { email } })
    if (!parent)
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })

    const valid = await bcrypt.compare(password, parent.password)
    if (!valid)
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })

    // Separate message for pending approval
    if (!parent.isActive)
      return NextResponse.json({ error: 'PENDING_APPROVAL', studentName: parent.studentName }, { status: 403 })

    const token = await new SignJWT({ parentId: parent.id, email: parent.email, seatNumber: parent.seatNumber })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    const res = NextResponse.json({
      success: true,
      parent: { id: parent.id, name: parent.name, email: parent.email, studentName: parent.studentName, gradeAr: parent.gradeAr },
    })
    res.cookies.set('parent_token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
