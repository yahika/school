import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.conductNote.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/student-affairs/conduct/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الملاحظة' }, { status: 500 })
  }
}
