import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signStaffToken, setStaffCookieHeader, departmentHref } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }

    const staff = await prisma.staff.findUnique({ where: { username } })

    // Always run bcrypt compare to prevent timing attacks
    const validPassword = staff
      ? await bcrypt.compare(password, staff.password)
      : await bcrypt.compare(password, '$2a$12$invalidhashtopreventtiming000000000000000000000')

    if (!staff || !validPassword) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (!staff.isActive) {
      return NextResponse.json({ error: 'هذا الحساب غير مُفعّل، يرجى مراجعة الإدارة' }, { status: 403 })
    }

    const token = await signStaffToken({
      staffId: staff.id,
      username: staff.username,
      name: staff.name,
      department: staff.department,
    })

    return NextResponse.json(
      {
        success: true,
        name: staff.name,
        username: staff.username,
        department: staff.department,
        redirectTo: departmentHref(staff.department),
      },
      { headers: { 'Set-Cookie': setStaffCookieHeader(token) } }
    )
  } catch (err) {
    console.error('[staff/login]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
