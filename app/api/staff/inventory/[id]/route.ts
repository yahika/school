import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/inventory/[id] — single item + recent stock-movement history
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 30 } },
    })
    if (!item) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 })
    return NextResponse.json({ item })
  } catch (err) {
    console.error('[staff/inventory/:id GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// PATCH /api/staff/inventory/[id] — edit item details (including a direct quantity correction / stock-take)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const b = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof b.nameAr === 'string' && b.nameAr.trim()) data.nameAr = b.nameAr.trim()
    if (typeof b.nameEn === 'string') data.nameEn = b.nameEn.trim() || null
    if (typeof b.category === 'string' && b.category.trim()) data.category = b.category.trim()
    if (typeof b.sku === 'string') data.sku = b.sku.trim() || null
    if (typeof b.unit === 'string' && b.unit.trim()) data.unit = b.unit.trim()
    if (typeof b.supplier === 'string') data.supplier = b.supplier.trim() || null
    if (typeof b.notes === 'string') data.notes = b.notes.trim() || null
    if (b.quantity !== undefined) {
      const quantity = Number(b.quantity)
      if (!Number.isFinite(quantity) || quantity < 0) return NextResponse.json({ error: 'الكمية غير صحيحة' }, { status: 400 })
      data.quantity = quantity
    }
    if (b.minThreshold !== undefined) {
      const minThreshold = Number(b.minThreshold)
      if (!Number.isFinite(minThreshold) || minThreshold < 0) return NextResponse.json({ error: 'حد التنبيه غير صحيح' }, { status: 400 })
      data.minThreshold = minThreshold
    }
    if (b.unitPrice !== undefined) {
      if (b.unitPrice === '' || b.unitPrice === null) data.unitPrice = null
      else {
        const unitPrice = Number(b.unitPrice)
        if (!Number.isFinite(unitPrice) || unitPrice < 0) return NextResponse.json({ error: 'سعر الوحدة غير صحيح' }, { status: 400 })
        data.unitPrice = unitPrice
      }
    }

    const item = await prisma.inventoryItem.update({ where: { id }, data })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('[staff/inventory/:id PATCH]', err)
    return NextResponse.json({ error: 'تعذّر تعديل الصنف' }, { status: 500 })
  }
}

// DELETE /api/staff/inventory/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.inventoryItem.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff/inventory/:id DELETE]', err)
    return NextResponse.json({ error: 'تعذّر حذف الصنف' }, { status: 500 })
  }
}
