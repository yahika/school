import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await prisma.examSchedule.findMany({ orderBy: [{ examDate: 'asc' }] })
  return NextResponse.json({ schedule: items })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titleAr, titleEn, gradeAr, gradeEn, subjectAr, subjectEn, examDate, startTime, location } = body
    if (!titleAr || !gradeAr || !subjectAr || !examDate)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const item = await prisma.examSchedule.create({
      data: { titleAr, titleEn: titleEn ?? titleAr, gradeAr, gradeEn: gradeEn ?? gradeAr, subjectAr, subjectEn: subjectEn ?? subjectAr, examDate, startTime, location },
    })
    return NextResponse.json({ item })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
