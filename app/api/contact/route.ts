import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json()
    if (!name || !phone || !message)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    await prisma.contactMessage.create({ data: { name, email, phone, message } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
