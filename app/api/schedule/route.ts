import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const items = await prisma.examSchedule.findMany({ orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }] })
  return NextResponse.json({ schedule: items })
}
