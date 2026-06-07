import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { isActive } = await req.json()
  const parent = await prisma.parentAccount.update({
    where: { id: parseInt(params.id) },
    data: { isActive },
  })
  return NextResponse.json({ parent })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.parentAccount.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
