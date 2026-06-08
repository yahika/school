import { NextResponse } from 'next/server'
import { clearStaffCookieHeader } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': clearStaffCookieHeader() } }
  )
}
