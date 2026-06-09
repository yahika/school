import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// POST /api/staff/buses/notify
// Body: { busId: number, message?: string }
// Sends a WhatsApp message to all active riders' phone numbers for a given bus.
export async function POST(req: NextRequest) {
  try {
    const { busId, message } = await req.json() as { busId: number; message?: string }
    if (!busId) return NextResponse.json({ error: 'busId مطلوب' }, { status: 400 })

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: { riders: { where: { isActive: true, phone: { not: null } } } },
    })
    if (!bus) return NextResponse.json({ error: 'الباص غير موجود' }, { status: 404 })

    const riders = bus.riders.filter(r => r.phone)
    if (riders.length === 0) {
      return NextResponse.json({ sent: 0, total: 0, note: 'لا يوجد أرقام هاتف مسجلة لركاب هذا الباص' })
    }

    const text = message?.trim() ||
      `🚌 *إشعار من أكاديمية النخبة الأمريكية*\n\n` +
      `سيتأخر الباص *${bus.code}*${bus.routeAr ? ` (${bus.routeAr})` : ''} عن موعده المعتاد.\n\n` +
      `نعتذر عن الإزعاج ونشكركم على تفهمكم 🙏`

    let sent = 0
    for (const r of riders) {
      if (!r.phone) continue
      const ok = await sendWhatsApp(r.phone, text)
      if (ok) sent++
    }

    return NextResponse.json({ sent, total: riders.length })
  } catch (err) {
    console.error('[buses/notify POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
