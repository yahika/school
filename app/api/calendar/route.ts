import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    where: { isPublic: true },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json({ events })
}
