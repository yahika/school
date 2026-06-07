import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const app = await prisma.application.update({ where: { id: parseInt(params.id) }, data: { status } })
  return NextResponse.json({ application: app })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.application.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
