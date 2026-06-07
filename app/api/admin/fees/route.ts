import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const fees = await prisma.feeRecord.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ fees })
}

export async function POST(req: NextRequest) {
  try {
    const { studentName, seatNumber, gradeAr, amount, academicYear, notes } = await req.json()
    if (!studentName || !gradeAr || !amount || !academicYear)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const fee = await prisma.feeRecord.create({
      data: { studentName, seatNumber, gradeAr, amount: Number(amount), academicYear, notes },
    })
    return NextResponse.json({ fee })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
