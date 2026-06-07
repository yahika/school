import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const seat = searchParams.get('seat')?.trim()
  const name = searchParams.get('name')?.trim()
  const dob  = searchParams.get('dob')?.trim()        // YYYY-MM-DD — optional, narrows results
  const semId = searchParams.get('semesterId')         // optional — latest if omitted

  // ── Require at least seat or name ─────────────────────────────────────────
  if (!seat && !name) {
    return NextResponse.json({ error: 'seatOrName' }, { status: 400 })
  }

  try {
    // ── Resolve semester ──────────────────────────────────────────────────
    let semesterId: number | undefined
    if (semId) {
      semesterId = parseInt(semId)
    } else {
      const latest = await prisma.semester.findFirst({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
      })
      if (!latest) return NextResponse.json({ error: 'noPublished' }, { status: 404 })
      semesterId = latest.id
    }

    const include = {
      subjects: { orderBy: { orderIdx: 'asc' } },
      semester: { select: { nameAr: true, nameEn: true, academicYear: true, term: true } },
    } as const

    // ── Seat number lookup (exact) ────────────────────────────────────────
    if (seat) {
      const result = await prisma.result.findUnique({
        where: { semesterId_seatNumber: { semesterId, seatNumber: seat } },
        include,
      })

      // If name was also given, verify it loosely
      if (result && name) {
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
        const stored = norm((result.nameAr ?? '') + ' ' + (result.nameEn ?? ''))
        const input  = norm(name)
        if (!stored.includes(input) && !input.includes(norm(result.nameAr ?? ''))) {
          return NextResponse.json({ error: 'verifyFailed' }, { status: 403 })
        }
      }

      if (!result) return NextResponse.json({ error: 'notFound' }, { status: 404 })
      return NextResponse.json({ result })
    }

    // ── Name search (Arabic OR English, case-insensitive) ─────────────────
    const matches = await prisma.result.findMany({
      where: {
        semesterId,
        OR: [
          { nameAr: { contains: name! } },
          { nameEn: { contains: name! } },
        ],
      },
      include,
      orderBy: { nameAr: 'asc' },
    })

    if (matches.length === 0) {
      return NextResponse.json({ error: 'notFound' }, { status: 404 })
    }

    // If DOB is given, use it to pick the exact student
    if (dob) {
      const exact = matches.find(r => r.dateOfBirth === dob)
      if (!exact) return NextResponse.json({ error: 'verifyFailed' }, { status: 403 })
      return NextResponse.json({ result: exact })
    }

    // Single match → return directly; multiple → return all for the client to display
    if (matches.length === 1) {
      return NextResponse.json({ result: matches[0] })
    }
    return NextResponse.json({ results: matches })

  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json({ error: 'serverError' }, { status: 500 })
  }
}
