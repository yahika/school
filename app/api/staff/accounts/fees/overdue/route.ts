import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/accounts/fees/overdue
// Returns all unpaid FeeRecords, joined with any phone from StudentFile if available.
export async function GET() {
  try {
    const unpaid = await prisma.feeRecord.findMany({
      where: { isPaid: false },
      orderBy: [{ gradeAr: 'asc' }, { studentName: 'asc' }],
    })

    // Try to look up a phone number from StudentFile for each overdue record
    const enriched = await Promise.all(unpaid.map(async f => {
      let phone: string | null = null
      if (f.seatNumber) {
        const file = await prisma.studentFile.findUnique({
          where: { seatNumber: f.seatNumber },
          select: { guardianPhone: true },
        })
        phone = file?.guardianPhone ?? null
      }
      return { ...f, phone }
    }))

    return NextResponse.json({ overdue: enriched, total: enriched.length })
  } catch (err) {
    console.error('[accounts/fees/overdue GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
