import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'
import { signStaffToken, departmentHref } from '@/lib/staffAuth'
import { prisma } from '@/lib/db'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

// DEV ONLY — never runs in production.
// Mints real auth cookies without needing a password so you can browse
// any portal instantly from the DevBar.
// Usage:
//   /api/dev/bypass?as=admin            → admin dashboard
//   /api/dev/bypass?as=staff&dept=buses → staff/buses
//   /api/dev/bypass?as=parent           → parent dashboard (first account in DB)
//   /api/dev/bypass?as=clear            → wipe all cookies → home

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const as = searchParams.get('as') ?? ''
  const dept = searchParams.get('dept') ?? 'student_affairs'

  // ── Clear all auth cookies ────────────────────────────────────────────────
  if (as === 'clear') {
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set('as-admin-token', '', { maxAge: 0, path: '/' })
    res.cookies.set('as-staff-token', '', { maxAge: 0, path: '/' })
    res.cookies.set('parent_token', '', { maxAge: 0, path: '/' })
    return res
  }

  // ── Admin bypass ─────────────────────────────────────────────────────────
  if (as === 'admin') {
    const token = await signToken({ adminId: 1, username: 'dev-admin' })
    const res = NextResponse.redirect(new URL('/admin/dashboard', req.url))
    res.cookies.set('as-admin-token', token, { httpOnly: true, path: '/', maxAge: 28800, sameSite: 'lax' })
    return res
  }

  // ── Staff bypass (any department) ────────────────────────────────────────
  if (as === 'staff') {
    const token = await signStaffToken({
      staffId: 1,
      username: 'dev-staff',
      name: 'Dev User',
      department: dept,
    })
    const href = departmentHref(dept)
    const res = NextResponse.redirect(new URL(href, req.url))
    res.cookies.set('as-staff-token', token, { httpOnly: true, path: '/', maxAge: 28800, sameSite: 'lax' })
    return res
  }

  // ── Parent bypass — uses first parent account in DB ──────────────────────
  if (as === 'parent') {
    const parent = await prisma.parentAccount.findFirst({ where: { isActive: true } })
    if (!parent) {
      // No parent accounts exist yet — redirect to login with a notice
      return NextResponse.redirect(new URL('/parent/login?dev=no-parent', req.url))
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')
    const token = await new SignJWT({ parentId: parent.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret)
    const res = NextResponse.redirect(new URL('/parent/dashboard', req.url))
    res.cookies.set('parent_token', token, { httpOnly: true, path: '/', maxAge: 28800, sameSite: 'lax' })
    return res
  }

  return NextResponse.json({ error: 'Unknown bypass target' }, { status: 400 })
}
