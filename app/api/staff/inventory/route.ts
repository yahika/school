import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const INVENTORY_CATEGORIES = ['كتب', 'يونيفورم', 'قرطاسية', 'أخرى']

// GET /api/staff/inventory?search=&category=&lowStock=1 — list inventory items
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const category = req.nextUrl.searchParams.get('category')?.trim()
  const lowStock = req.nextUrl.searchParams.get('lowStock') === '1'

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(search ? { OR: [{ nameAr: { contains: search } }, { nameEn: { contains: search } }, { sku: { contains: search } }, { supplier: { contains: search } }] } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { nameAr: 'asc' },
    include: { _count: { select: { movements: true } } },
  })

  const mapped = items
    .map(i => ({
      id: i.id, nameAr: i.nameAr, nameEn: i.nameEn, category: i.category, sku: i.sku,
      quantity: i.quantity, unit: i.unit, minThreshold: i.minThreshold, unitPrice: i.unitPrice,
      supplier: i.supplier, notes: i.notes, createdAt: i.createdAt,
      isLow: i.quantity <= i.minThreshold,
      movementCount: i._count.movements,
    }))
    .filter(i => !lowStock || i.isLow)

  return NextResponse.json({ items: mapped, categories: INVENTORY_CATEGORIES })
}

// POST /api/staff/inventory — create a new inventory item
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.nameAr?.trim() || !b.category?.trim()) {
      return NextResponse.json({ error: 'اسم الصنف والفئة حقول مطلوبة' }, { status: 400 })
    }
    const quantity = b.quantity !== undefined && b.quantity !== '' ? Number(b.quantity) : 0
    const minThreshold = b.minThreshold !== undefined && b.minThreshold !== '' ? Number(b.minThreshold) : 0
    if (!Number.isFinite(quantity) || quantity < 0) return NextResponse.json({ error: 'الكمية غير صحيحة' }, { status: 400 })
    if (!Number.isFinite(minThreshold) || minThreshold < 0) return NextResponse.json({ error: 'حد التنبيه غير صحيح' }, { status: 400 })
    let unitPrice: number | null = null
    if (b.unitPrice !== undefined && b.unitPrice !== '' && b.unitPrice !== null) {
      unitPrice = Number(b.unitPrice)
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return NextResponse.json({ error: 'سعر الوحدة غير صحيح' }, { status: 400 })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        nameAr: b.nameAr.trim(),
        nameEn: b.nameEn?.trim() || null,
        category: b.category.trim(),
        sku: b.sku?.trim() || null,
        quantity,
        unit: b.unit?.trim() || 'قطعة',
        minThreshold,
        unitPrice,
        supplier: b.supplier?.trim() || null,
        notes: b.notes?.trim() || null,
      },
    })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('[staff/inventory POST]', err)
    return NextResponse.json({ error: 'تعذّر إضافة الصنف' }, { status: 500 })
  }
}
