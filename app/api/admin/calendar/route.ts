import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const events = await prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const event = await prisma.calendarEvent.create({ data: body })
  return NextResponse.json({ event })
}
