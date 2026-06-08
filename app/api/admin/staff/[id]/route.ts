import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_DEPARTMENTS = ['student_affairs', 'buses', 'accounts', 'results_control', 'inventory']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const { name, department, isActive, password } = await req.json()

    const data: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) data.name = name.trim()
    if (typeof department === 'string') {
      if (!VALID_DEPARTMENTS.includes(department)) {
        return NextResponse.json({ error: 'القسم غير صحيح' }, { status: 400 })
      }
      data.department = department
    }
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (typeof password === 'string' && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
      }
      data.password = await bcrypt.hash(password, 12)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'لا يوجد ما يتم تعديله' }, { status: 400 })
    }

    const staff = await prisma.staff.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, department: true, isActive: true, createdAt: true },
    })
    return NextResponse.json({ success: true, staff })
  } catch (err) {
    console.error('[admin/staff/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل الحساب' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.staff.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/staff/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الحساب' }, { status: 500 })
  }
}
