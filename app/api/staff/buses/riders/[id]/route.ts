import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof b.pickupPoint === 'string') data.pickupPoint = b.pickupPoint.trim() || null
    if (typeof b.phone === 'string') data.phone = b.phone.trim() || null
    if (typeof b.gradeAr === 'string' && b.gradeAr.trim()) data.gradeAr = b.gradeAr.trim()
    if (typeof b.isActive === 'boolean') data.isActive = b.isActive

    const rider = await prisma.busRider.update({ where: { id }, data })
    return NextResponse.json({ success: true, rider })
  } catch (err) {
    console.error('[staff/buses/riders/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل بيانات الراكب' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.busRider.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/buses/riders/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الراكب' }, { status: 500 })
  }
}
