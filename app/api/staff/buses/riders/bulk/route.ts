import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/buses/riders/bulk
// Body: { riders: Array<{ busCode, seatNumber, studentName, gradeAr, pickupPoint?, phone? }> }
// busCode is matched to an existing bus by code; skipped if bus not found
export async function POST(req: NextRequest) {
  try {
    const { riders } = await req.json() as { riders: Record<string, string>[] }
    if (!Array.isArray(riders) || riders.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }

    // Cache bus lookups to avoid N queries
    const busCache = new Map<string, number>()
    let created = 0, updated = 0
    const errors: string[] = []

    for (const r of riders) {
      const busCode     = String(r.busCode ?? '').trim()
      const seatNumber  = String(r.seatNumber ?? '').trim()
      const studentName = String(r.studentName ?? '').trim()
      const gradeAr     = String(r.gradeAr ?? '').trim()

      if (!busCode || !seatNumber || !studentName || !gradeAr) {
        errors.push(`صف ناقص: ${JSON.stringify(r)}`)
        continue
      }

      try {
        // Resolve bus id
        if (!busCache.has(busCode)) {
          const bus = await prisma.bus.findUnique({ where: { code: busCode } })
          if (!bus) { errors.push(`كود باص غير موجود: ${busCode}`); continue }
          busCache.set(busCode, bus.id)
        }
        const busId = busCache.get(busCode)!

        const data = {
          busId,
          studentName,
          gradeAr,
          pickupPoint: r.pickupPoint ? String(r.pickupPoint).trim() : undefined,
          phone:       r.phone       ? String(r.phone).trim()       : undefined,
          isActive: true,
        }

        const existing = await prisma.busRider.findFirst({ where: { busId, seatNumber } })
        if (existing) {
          await prisma.busRider.update({ where: { id: existing.id }, data })
          updated++
        } else {
          await prisma.busRider.create({ data: { seatNumber, ...data } })
          created++
        }
      } catch (e) {
        errors.push(`${seatNumber}: ${e instanceof Error ? e.message : 'خطأ'}`)
      }
    }

    return NextResponse.json({ created, updated, errors })
  } catch (err) {
    console.error('[buses/riders/bulk POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
