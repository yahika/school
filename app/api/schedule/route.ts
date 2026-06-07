import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await prisma.examSchedule.findMany({ orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }] })
  return NextResponse.json({ schedule: items })
}
