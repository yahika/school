import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/staff/inventory/bulk
// Body: { items: Array<{nameAr, nameEn?, category, sku?, quantity, unit?, minThreshold?, unitPrice?, supplier?, notes?}> }
export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: Record<string, string | number>[] }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }

    let created = 0, updated = 0
    const errors: string[] = []

    for (const i of items) {
      const nameAr   = String(i.nameAr ?? '').trim()
      const category = String(i.category ?? '').trim()
      const quantity = Number(i.quantity ?? 0)
      if (!nameAr || !category) {
        errors.push(`صف ناقص: ${JSON.stringify(i)}`); continue
      }
      try {
        const data = {
          nameAr,
          nameEn:       i.nameEn       ? String(i.nameEn).trim()       : undefined,
          category,
          sku:          i.sku          ? String(i.sku).trim()          : undefined,
          quantity,
          unit:         i.unit         ? String(i.unit).trim()         : 'قطعة',
          minThreshold: i.minThreshold ? Number(i.minThreshold)        : 0,
          unitPrice:    i.unitPrice    ? Number(i.unitPrice)           : undefined,
          supplier:     i.supplier     ? String(i.supplier).trim()     : undefined,
          notes:        i.notes        ? String(i.notes).trim()        : undefined,
        }
        // Upsert by nameAr + category if sku not provided
        const key = i.sku ? String(i.sku).trim() : null
        const existing = key
          ? await prisma.inventoryItem.findFirst({ where: { sku: key } })
          : await prisma.inventoryItem.findFirst({ where: { nameAr, category } })

        if (existing) {
          await prisma.inventoryItem.update({ where: { id: existing.id }, data })
          updated++
        } else {
          await prisma.inventoryItem.create({ data })
          created++
        }
      } catch (e) {
        errors.push(`${nameAr}: ${e instanceof Error ? e.message : 'خطأ'}`)
      }
    }

    return NextResponse.json({ created, updated, errors })
  } catch (err) {
    console.error('[inventory/bulk POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
