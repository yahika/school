import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const staff = await prisma.staff.findMany({
    orderBy: [{ department: 'asc' }, { createdAt: 'desc' }],
    select: { id: true, username: true, name: true, department: true, isActive: true, createdAt: true },
  })
  return NextResponse.json({ staff })
}

const VALID_DEPARTMENTS = ['student_affairs', 'buses', 'accounts', 'results_control', 'inventory']

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, department } = await req.json()

    if (!username || !password || !name || !department) {
      return NextResponse.json({ error: 'كل الحقول مطلوبة' }, { status: 400 })
    }
    if (!VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: 'القسم غير صحيح' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    const exists = await prisma.staff.findUnique({ where: { username } })
    if (exists) {
      return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const staff = await prisma.staff.create({
      data: { username, password: hashed, name, department },
      select: { id: true, username: true, name: true, department: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ success: true, staff })
  } catch (err) {
    console.error('[admin/staff:POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
