import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const event = await prisma.calendarEvent.update({ where: { id: parseInt(params.id) }, data: body })
  return NextResponse.json({ event })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.calendarEvent.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
