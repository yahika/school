import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('parent_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload } = await jwtVerify(token, secret)
    const parent = await prisma.parentAccount.findUnique({
      where: { id: payload.parentId as number },
    })
    if (!parent || !parent.isActive)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({
      parent: {
        id: parent.id, name: parent.name, email: parent.email,
        phone: parent.phone, studentName: parent.studentName,
        seatNumber: parent.seatNumber, gradeAr: parent.gradeAr, gradeEn: parent.gradeEn,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
