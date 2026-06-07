import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ announcements: items })
}

export async function POST(req: NextRequest) {
  try {
    const { titleAr, titleEn, bodyAr, bodyEn, isPublished } = await req.json()
    if (!titleAr || !titleEn || !bodyAr || !bodyEn)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const item = await prisma.announcement.create({
      data: { titleAr, titleEn, bodyAr, bodyEn, isPublished: !!isPublished, publishedAt: isPublished ? new Date() : null },
    })
    return NextResponse.json({ announcement: item })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
