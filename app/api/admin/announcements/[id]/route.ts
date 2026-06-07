import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (typeof body.isPublished === 'boolean') {
    data.publishedAt = body.isPublished ? new Date() : null
  }
  const item = await prisma.announcement.update({ where: { id }, data })
  return NextResponse.json({ announcement: item })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.announcement.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
