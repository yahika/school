import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const msgs = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ messages: msgs })
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  await prisma.contactMessage.update({ where: { id }, data: { isRead: true } })
  return NextResponse.json({ success: true })
}
