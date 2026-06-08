import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET ?busId=123  → riders of one bus   |   ?search=...  → search across all riders
export async function GET(req: NextRequest) {
  const busId = req.nextUrl.searchParams.get('busId')
  const search = req.nextUrl.searchParams.get('search')?.trim()

  const riders = await prisma.busRider.findMany({
    where: {
      ...(busId ? { busId: parseInt(busId) } : {}),
      ...(search ? { OR: [{ studentName: { contains: search } }, { seatNumber: { contains: search } }] } : {}),
    },
    orderBy: { studentName: 'asc' },
    include: { bus: { select: { id: true, code: true, routeAr: true } } },
  })
  return NextResponse.json({ riders })
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.busId || !b.seatNumber?.trim() || !b.studentName?.trim() || !b.gradeAr?.trim()) {
      return NextResponse.json({ error: 'الباص ورقم الجلوس واسم الطالب والصف حقول مطلوبة' }, { status: 400 })
    }

    const bus = await prisma.bus.findUnique({ where: { id: parseInt(b.busId) }, include: { _count: { select: { riders: { where: { isActive: true } } } } } })
    if (!bus) return NextResponse.json({ error: 'الباص غير موجود' }, { status: 404 })

    const dupe = await prisma.busRider.findFirst({ where: { busId: bus.id, seatNumber: b.seatNumber.trim(), isActive: true } })
    if (dupe) return NextResponse.json({ error: 'هذا الطالب مسجّل بالفعل على متن هذا الباص' }, { status: 409 })

    if (bus.capacity > 0 && bus._count.riders >= bus.capacity) {
      return NextResponse.json({ error: `الباص ممتلئ (السعة ${bus.capacity} راكب) — أضف الطالب لباص آخر أو حدّث السعة` }, { status: 409 })
    }

    const rider = await prisma.busRider.create({
      data: {
        busId: bus.id,
        seatNumber: b.seatNumber.trim(),
        studentName: b.studentName.trim(),
        gradeAr: b.gradeAr.trim(),
        pickupPoint: b.pickupPoint?.trim() || null,
        phone: b.phone?.trim() || null,
        isActive: true,
      },
    })
    return NextResponse.json({ success: true, rider })
  } catch (err) {
    console.error('[staff/buses/riders POST]', err)
    return NextResponse.json({ error: 'تعذّر إضافة الراكب' }, { status: 500 })
  }
}
