import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contactMessage.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
