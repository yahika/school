import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const status = req.nextUrl.searchParams.get('status')?.trim()

  const buses = await prisma.bus.findMany({
    where: {
      ...(search ? { OR: [{ code: { contains: search } }, { driverName: { contains: search } }, { routeAr: { contains: search } }, { plateNumber: { contains: search } }] } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { code: 'asc' },
    include: { _count: { select: { riders: { where: { isActive: true } } } } },
  })

  return NextResponse.json({
    buses: buses.map(b => ({
      id: b.id, code: b.code, plateNumber: b.plateNumber, driverName: b.driverName, driverPhone: b.driverPhone,
      supervisorName: b.supervisorName, supervisorPhone: b.supervisorPhone, capacity: b.capacity,
      routeAr: b.routeAr, routeEn: b.routeEn, stops: b.stops, monthlyFee: b.monthlyFee, status: b.status, notes: b.notes,
      riderCount: b._count.riders,
    })),
  })
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.code?.trim() || !b.driverName?.trim()) {
      return NextResponse.json({ error: 'كود الباص واسم السائق حقول مطلوبة' }, { status: 400 })
    }

    const exists = await prisma.bus.findUnique({ where: { code: b.code.trim() } })
    if (exists) return NextResponse.json({ error: 'يوجد باص بهذا الكود بالفعل' }, { status: 409 })

    const bus = await prisma.bus.create({
      data: {
        code: b.code.trim(),
        plateNumber: b.plateNumber?.trim() || null,
        driverName: b.driverName.trim(),
        driverPhone: b.driverPhone?.trim() || null,
        supervisorName: b.supervisorName?.trim() || null,
        supervisorPhone: b.supervisorPhone?.trim() || null,
        capacity: Number.isFinite(+b.capacity) ? Math.max(0, Math.trunc(+b.capacity)) : 0,
        routeAr: b.routeAr?.trim() || null,
        routeEn: b.routeEn?.trim() || null,
        stops: b.stops?.trim() || null,
        monthlyFee: b.monthlyFee !== '' && b.monthlyFee != null && Number.isFinite(+b.monthlyFee) ? +b.monthlyFee : null,
        status: b.status || 'active',
        notes: b.notes?.trim() || null,
      },
    })
    return NextResponse.json({ success: true, bus })
  } catch (err) {
    console.error('[staff/buses POST]', err)
    return NextResponse.json({ error: 'تعذّر إنشاء الباص' }, { status: 500 })
  }
}
