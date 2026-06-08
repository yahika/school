import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const where = search
    ? { OR: [{ nameAr: { contains: search } }, { seatNumber: { contains: search } }, { gradeAr: { contains: search } }] }
    : {}

  const files = await prisma.studentFile.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ files })
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.seatNumber?.trim() || !b.nameAr?.trim() || !b.gradeAr?.trim()) {
      return NextResponse.json({ error: 'رقم الجلوس والاسم والصف حقول مطلوبة' }, { status: 400 })
    }

    const exists = await prisma.studentFile.findUnique({ where: { seatNumber: b.seatNumber.trim() } })
    if (exists) {
      return NextResponse.json({ error: 'يوجد ملف بهذا الرقم بالفعل' }, { status: 409 })
    }

    const file = await prisma.studentFile.create({
      data: {
        seatNumber: b.seatNumber.trim(),
        nameAr: b.nameAr.trim(),
        nameEn: b.nameEn?.trim() || null,
        gradeAr: b.gradeAr.trim(),
        gradeEn: b.gradeEn?.trim() || null,
        nationalId: b.nationalId?.trim() || null,
        dateOfBirth: b.dateOfBirth?.trim() || null,
        address: b.address?.trim() || null,
        guardianName: b.guardianName?.trim() || null,
        guardianPhone: b.guardianPhone?.trim() || null,
        guardianRelation: b.guardianRelation?.trim() || null,
        emergencyPhone: b.emergencyPhone?.trim() || null,
        medicalNotes: b.medicalNotes?.trim() || null,
        enrollDate: b.enrollDate?.trim() || null,
        status: b.status || 'active',
        notes: b.notes?.trim() || null,
      },
    })
    return NextResponse.json({ success: true, file })
  } catch (err) {
    console.error('[staff/student-affairs/students POST]', err)
    return NextResponse.json({ error: 'تعذّر إنشاء الملف' }, { status: 500 })
  }
}
