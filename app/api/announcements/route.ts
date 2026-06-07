import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({ announcements: items })
}
