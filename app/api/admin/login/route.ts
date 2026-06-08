import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setCookieHeader } from '@/lib/auth'
import { signStaffToken, setStaffCookieHeader, departmentHref } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

const DUMMY_HASH = '$2a$12$invalidhashtopreventtiming000000000000000000000'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // 1) Try the main admin account first
    const admin = await prisma.admin.findUnique({ where: { username } })
    const adminPasswordOk = admin
      ? await bcrypt.compare(password, admin.password)
      : await bcrypt.compare(password, DUMMY_HASH)

    if (admin && adminPasswordOk) {
      const token = await signToken({ adminId: admin.id, username: admin.username })
      return NextResponse.json(
        { success: true, username: admin.username, redirectTo: '/admin/dashboard' },
        { headers: { 'Set-Cookie': setCookieHeader(token) } }
      )
    }

    // 2) Fall back to staff accounts — lets department staff sign in from the same page
    const staff = await prisma.staff.findUnique({ where: { username } })
    const staffPasswordOk = staff
      ? await bcrypt.compare(password, staff.password)
      : await bcrypt.compare(password, DUMMY_HASH)

    if (staff && staffPasswordOk && staff.isActive) {
      const token = await signStaffToken({
        staffId: staff.id,
        username: staff.username,
        name: staff.name,
        department: staff.department,
      })
      return NextResponse.json(
        {
          success: true,
          username: staff.username,
          name: staff.name,
          department: staff.department,
          redirectTo: departmentHref(staff.department),
        },
        { headers: { 'Set-Cookie': setStaffCookieHeader(token) } }
      )
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
