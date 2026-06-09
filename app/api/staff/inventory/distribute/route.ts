import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/inventory/distribute
// Distributes inventory items to all students in a given grade.
// Body: { gradeAr: string, items: [{itemId, quantityPerStudent}], recordedBy?: string }
// Creates StockMovement(type='out') per item and decrements quantity.
export async function POST(req: NextRequest) {
  try {
    const { gradeAr, items, recordedBy } = await req.json() as {
      gradeAr: string
      items: { itemId: number; quantityPerStudent: number }[]
      recordedBy?: string
    }

    if (!gradeAr || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'الصف وقائمة الأصناف مطلوبان' }, { status: 400 })
    }

    // Count students in this grade from StudentFile
    const studentCount = await prisma.studentFile.count({ where: { gradeAr, status: 'active' } })
    if (studentCount === 0) {
      return NextResponse.json({ error: `لا يوجد طلاب نشطون في الصف "${gradeAr}"` }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const results: { itemId: number; nameAr: string; total: number; remaining: number }[] = []

    for (const { itemId, quantityPerStudent } of items) {
      if (!itemId || quantityPerStudent <= 0) continue
      const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
      if (!item) { results.push({ itemId, nameAr: '؟', total: 0, remaining: -1 }); continue }

      const total = quantityPerStudent * studentCount
      if (item.quantity < total) {
        results.push({ itemId, nameAr: item.nameAr, total, remaining: item.quantity })
        continue  // not enough stock — skip, report
      }

      await prisma.$transaction([
        prisma.stockMovement.create({
          data: {
            itemId, type: 'out', quantity: total, date: today,
            reason: `توزيع على ${studentCount} طالب من ${gradeAr} (${quantityPerStudent} لكل طالب)`,
            recordedBy: recordedBy ?? undefined,
          },
        }),
        prisma.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: { decrement: total } },
        }),
      ])
      results.push({ itemId, nameAr: item.nameAr, total, remaining: item.quantity - total })
    }

    return NextResponse.json({ studentCount, results })
  } catch (err) {
    console.error('[inventory/distribute POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
