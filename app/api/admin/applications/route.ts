import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const apps = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ applications: apps })
}
