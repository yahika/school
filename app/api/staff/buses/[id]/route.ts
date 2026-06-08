import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const bus = await prisma.bus.findUnique({
    where: { id: parseInt(params.id) },
    include: { riders: { orderBy: { studentName: 'asc' } } },
  })
  if (!bus) return NextResponse.json({ error: 'الباص غير موجود' }, { status: 404 })
  return NextResponse.json({ bus })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()

    if (typeof b.code === 'string' && b.code.trim()) {
      const dupe = await prisma.bus.findFirst({ where: { code: b.code.trim(), NOT: { id } } })
      if (dupe) return NextResponse.json({ error: 'يوجد باص آخر بهذا الكود' }, { status: 409 })
    }

    const data: Record<string, unknown> = {}
    const nullableFields = ['plateNumber', 'driverName', 'driverPhone', 'supervisorName', 'supervisorPhone', 'routeAr', 'routeEn', 'stops', 'notes'] as const
    for (const f of nullableFields) if (typeof b[f] === 'string') data[f] = b[f].trim() || null

    if (typeof b.code === 'string' && b.code.trim()) data.code = b.code.trim()
    if (typeof b.status === 'string' && b.status.trim()) data.status = b.status.trim()
    if (b.capacity !== undefined) data.capacity = Number.isFinite(+b.capacity) ? Math.max(0, Math.trunc(+b.capacity)) : 0
    if (b.monthlyFee !== undefined) data.monthlyFee = b.monthlyFee !== '' && b.monthlyFee != null && Number.isFinite(+b.monthlyFee) ? +b.monthlyFee : null

    const bus = await prisma.bus.update({ where: { id }, data })
    return NextResponse.json({ success: true, bus })
  } catch (err) {
    console.error('[staff/buses/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل بيانات الباص' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.bus.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/buses/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الباص — قد يكون به ركاب مسجلون' }, { status: 500 })
  }
}
