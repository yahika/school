import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    where: { isPublic: true },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json({ events })
}
