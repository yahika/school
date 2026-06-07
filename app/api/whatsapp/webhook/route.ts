import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// UltraMsg webhook — receives JSON, responds by calling UltraMsg send API
// Docs: https://docs.ultramsg.com/api/post/messages/chat

async function sendWhatsApp(to: string, message: string) {
  const instance = process.env.ULTRAMSG_INSTANCE
  const token = process.env.ULTRAMSG_TOKEN
  if (!instance || !token) {
    console.warn('[WhatsApp] ULTRAMSG_INSTANCE or ULTRAMSG_TOKEN not set')
    return
  }
  await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token, to, body: message }),
  })
}

function formatResult(result: {
  nameAr: string
  seatNumber: string
  gradeAr: string
  totalScore: number
  maxScore: number
  percentage: number
  status: string
  letterGrade: string | null
  rank: number | null
  subjects: { nameAr: string; score: number; maxScore: number; status: string }[]
  semester: { nameAr: string; academicYear: string }
}): string {
  const statusAr = result.status === 'pass' ? '✅ ناجح' : '❌ راسب'
  const pct = result.percentage.toFixed(1)

  const subjectLines = result.subjects
    .slice(0, 8)
    .map(s => {
      const icon = s.status === 'pass' ? '✅' : '❌'
      return `${icon} ${s.nameAr}: ${s.score}/${s.maxScore}`
    })
    .join('\n')

  const rankLine = result.rank ? `🏆 الترتيب: ${result.rank}` : ''
  const gradeLine = result.letterGrade ? ` (${result.letterGrade})` : ''

  return [
    `🎓 *أكاديمية النخبة الأمريكية*`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 *${result.nameAr}*`,
    `🪑 رقم الجلوس: ${result.seatNumber}`,
    `📚 الصف: ${result.gradeAr}`,
    `📅 ${result.semester.nameAr} — ${result.semester.academicYear}`,
    ``,
    `📊 *المواد الدراسية*`,
    `━━━━━━━━━━━━━━━━━━`,
    subjectLines,
    ``,
    `📈 المجموع: ${result.totalScore}/${result.maxScore}`,
    `📉 النسبة: ${pct}%${gradeLine}`,
    rankLine,
    ``,
    `النتيجة النهائية: *${statusAr}*`,
    `━━━━━━━━━━━━━━━━━━`,
    `للمزيد: زر موقع الأكاديمية أو تواصل معنا`,
  ].filter(Boolean).join('\n')
}

const HELP_MSG =
  `مرحباً بك في *بوت نتائج أكاديمية النخبة* 🎓\n\n` +
  `أرسل *رقم الجلوس* فقط للاستعلام عن النتيجة.\n\n` +
  `📌 *مثال:*\n12345\n\n` +
  `سيتم إرسال آخر نتيجة متاحة فوراً ✨`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event_type?: string
      data?: {
        from?: string   // e.g. "201234567890@c.us"
        body?: string
        type?: string   // "chat" | "image" | etc.
      }
    }

    // Only handle incoming text messages
    if (body.event_type !== 'message_received') {
      return NextResponse.json({ ok: true })
    }

    const from = body.data?.from ?? ''
    const incomingMsg = (body.data?.body ?? '').trim()
    const type = body.data?.type ?? ''

    // Ignore non-text or empty messages
    if (!from || type !== 'chat' || !incomingMsg) {
      return NextResponse.json({ ok: true })
    }

    // Strip Arabic/English prefixes people might send before the number
    const cleaned = incomingMsg
      .replace(/^(نتيجة|نتيجه|result|الرقم|رقم الجلوس|seat|رقم)\s*/i, '')
      .trim()

    if (!cleaned || !/^\d+$/.test(cleaned)) {
      await sendWhatsApp(from, HELP_MSG)
      return NextResponse.json({ ok: true })
    }

    const seatNumber = cleaned

    // Fetch latest published result for this seat number
    const result = await prisma.result.findFirst({
      where: {
        seatNumber,
        semester: { isPublished: true },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subjects: { orderBy: { orderIdx: 'asc' } },
        semester: true,
      },
    })

    if (!result) {
      await sendWhatsApp(
        from,
        `⚠️ لم يتم العثور على نتيجة لرقم الجلوس *${seatNumber}*\n\n` +
        `تأكد من صحة الرقم أو تواصل مع الأكاديمية مباشرةً.`
      )
      return NextResponse.json({ ok: true })
    }

    await sendWhatsApp(from, formatResult(result))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp webhook error]', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

// Health check — UltraMsg may GET the URL to verify it's reachable
export async function GET() {
  return new NextResponse('WhatsApp webhook active ✓', { status: 200 })
}
