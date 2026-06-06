import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendResultNotifications } from '@/lib/whatsapp'

// PATCH /api/admin/semesters/[id] — publish/unpublish or update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (typeof body.isPublished === 'boolean') {
      data.isPublished = body.isPublished
      data.publishedAt = body.isPublished ? new Date() : null
    }

    const semester = await prisma.semester.update({ where: { id }, data })

    // ── Send WhatsApp notifications when publishing ───────────────────────────
    let whatsapp: { sent: number; failed: number; skipped: number } | null = null

    if (body.isPublished === true) {
      const results = await prisma.result.findMany({
        where: { semesterId: id },
        select: {
          nameAr: true,
          parentPhone: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          status: true,
          letterGrade: true,
          semester: { select: { nameAr: true } },
        },
      })

      const { sent, failed, skipped } = await sendResultNotifications(results)
      whatsapp = { sent, failed, skipped }
      console.log(`[WhatsApp] Semester ${id} published — sent: ${sent}, failed: ${failed}, skipped: ${skipped}`)
    }

    return NextResponse.json({ success: true, semester, whatsapp })
  } catch (err) {
    console.error('[semesters PATCH]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/admin/semesters/[id] — delete semester + cascade to results/subjects
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await prisma.semester.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[semesters DELETE]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

// GET /api/admin/semesters/[id] — get semester details + results preview
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        results: {
          include: { subjects: { orderBy: { orderIdx: 'asc' } } },
          orderBy: { seatNumber: 'asc' },
          take: 50,
        },
      },
    })
    if (!semester) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ semester })
  } catch (err) {
    console.error('[semesters GET id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
