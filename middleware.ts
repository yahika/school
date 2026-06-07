import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { jwtVerify } from 'jose'

const parentSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin protection ────────────────────────────────────────────────────────
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAdminApi  = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login'

  if (isAdminPage || isAdminApi) {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Parent portal protection ─────────────────────────────────────────────────
  const isParentPage = pathname.startsWith('/parent/dashboard')
  if (isParentPage) {
    const token = request.cookies.get('parent_token')?.value
    if (!token) return NextResponse.redirect(new URL('/parent/login', request.url))
    try {
      await jwtVerify(token, parentSecret)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/parent/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/parent/dashboard/:path*'],
}
