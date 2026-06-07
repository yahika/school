import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentNameAr, studentNameEn, dateOfBirth, gradeApplying, parentName, parentPhone, parentEmail, address, notes } = body
    if (!studentNameAr || !dateOfBirth || !gradeApplying || !parentName || !parentPhone)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const app = await prisma.application.create({
      data: { studentNameAr, studentNameEn, dateOfBirth, gradeApplying, parentName, parentPhone, parentEmail, address, notes },
    })
    return NextResponse.json({ success: true, id: app.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
