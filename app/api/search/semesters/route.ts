import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint — list published semesters for the search dropdown
export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, nameAr: true, nameEn: true },
    })
    return NextResponse.json({ semesters })
  } catch {
    return NextResponse.json({ semesters: [] })
  }
}
