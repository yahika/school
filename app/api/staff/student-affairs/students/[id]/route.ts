import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()

    const fields = ['nameAr', 'nameEn', 'gradeAr', 'gradeEn', 'nationalId', 'dateOfBirth', 'address',
      'guardianName', 'guardianPhone', 'guardianRelation', 'emergencyPhone', 'medicalNotes',
      'enrollDate', 'status', 'notes'] as const

    const data: Record<string, unknown> = {}
    for (const f of fields) {
      if (typeof b[f] === 'string') data[f] = b[f].trim() || null
    }
    if (typeof b.nameAr === 'string' && !b.nameAr.trim()) delete data.nameAr // required field, ignore empty
    if (typeof b.gradeAr === 'string' && !b.gradeAr.trim()) delete data.gradeAr

    const file = await prisma.studentFile.update({ where: { id }, data })
    return NextResponse.json({ success: true, file })
  } catch (err) {
    console.error('[staff/student-affairs/students/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل الملف' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.studentFile.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/student-affairs/students/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الملف' }, { status: 500 })
  }
}
