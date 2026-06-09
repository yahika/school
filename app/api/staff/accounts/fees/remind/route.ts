import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// POST /api/staff/accounts/fees/remind
// Body: { phone: string, studentName: string, amount: number, academicYear: string }
// Sends a single WhatsApp fee reminder.
export async function POST(req: NextRequest) {
  try {
    const { phone, studentName, amount, academicYear } = await req.json() as {
      phone: string; studentName: string; amount: number; academicYear: string
    }
    if (!phone || !studentName) {
      return NextResponse.json({ error: 'رقم الهاتف واسم الطالب مطلوبان' }, { status: 400 })
    }

    const message =
      `💰 *أكاديمية النخبة الأمريكية — تذكير بالرسوم*\n\n` +
      `ولي أمر الطالب *${studentName}*،\n\n` +
      `نُذكّركم بأن رسوم العام الدراسي *${academicYear}* البالغة *${Number(amount).toLocaleString()} ج.م* لم تُسدَّد بعد.\n\n` +
      `يرجى التواصل مع قسم الحسابات لإتمام السداد في أقرب وقت.\n\n` +
      `شكرًا لتعاونكم 🙏`

    const sent = await sendWhatsApp(phone, message)
    return NextResponse.json({ sent })
  } catch (err) {
    console.error('[accounts/fees/remind POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
