import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const id = searchParams.get('id')

  if (!email && !id)
    return NextResponse.json({ error: 'Provide email or id' }, { status: 400 })

  try {
    const application = await prisma.application.findFirst({
      where: id
        ? { id: parseInt(id) }
        : { parentEmail: { equals: email ?? '', mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, studentNameAr: true, gradeApplying: true, status: true, createdAt: true, parentEmail: true },
    })

    if (!application)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ application })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
