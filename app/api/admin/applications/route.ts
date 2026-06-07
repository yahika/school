import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apps = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ applications: apps })
}
