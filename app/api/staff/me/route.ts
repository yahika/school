import { NextResponse } from 'next/server'
import { getStaffFromCookies, departmentLabel, departmentHref } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const staff = await getStaffFromCookies()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    username: staff.username,
    name: staff.name,
    department: staff.department,
    departmentLabel: departmentLabel(staff.department),
    href: departmentHref(staff.department),
  })
}
