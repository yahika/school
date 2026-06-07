import { NextResponse } from 'next/server'
import { clearCookieHeader } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': clearCookieHeader() } }
  )
}
