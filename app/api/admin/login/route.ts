import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setCookieHeader } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const admin = await prisma.admin.findUnique({ where: { username } })

    // Always run bcrypt compare to prevent timing attacks
    const validPassword = admin
      ? await bcrypt.compare(password, admin.password)
      : await bcrypt.compare(password, '$2a$12$invalidhashtopreventtiming000000000000000000000')

    if (!admin || !validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken({ adminId: admin.id, username: admin.username })

    return NextResponse.json(
      { success: true, username: admin.username },
      { headers: { 'Set-Cookie': setCookieHeader(token) } }
    )
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
