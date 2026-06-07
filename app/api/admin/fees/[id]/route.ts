import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { isPaid } = await req.json()
  const fee = await prisma.feeRecord.update({
    where: { id: parseInt(params.id) },
    data: { isPaid: !!isPaid, paidAt: isPaid ? new Date() : null },
  })
  return NextResponse.json({ fee })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.feeRecord.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
