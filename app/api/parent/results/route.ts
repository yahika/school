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
    const seatNumber = payload.seatNumber as string

    const results = await prisma.result.findMany({
      where: { seatNumber },
      include: {
        subjects: { orderBy: { orderIdx: 'asc' } },
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
