import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'parent-secret-key')

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('parent_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload } = await jwtVerify(token, secret)
    const seatNumber = payload.seatNumber as string

    const fees = await prisma.feeRecord.findMany({
      where: { seatNumber },
      orderBy: { createdAt: 'desc' },
    })

    const total = fees.reduce((s, f) => s + f.amount, 0)
    const paid = fees.filter(f => f.isPaid).reduce((s, f) => s + f.amount, 0)
    const remaining = total - paid

    return NextResponse.json({ fees, summary: { total, paid, remaining } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
