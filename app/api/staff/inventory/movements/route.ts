import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStaffFromCookies } from '@/lib/staffAuth'

export const dynamic = 'force-dynamic'

// GET /api/staff/inventory/movements?itemId=&search= — recent stock-movement activity log
export async function GET(req: NextRequest) {
  const itemIdRaw = req.nextUrl.searchParams.get('itemId')
  const search = req.nextUrl.searchParams.get('search')?.trim()

  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(itemIdRaw ? { itemId: parseInt(itemIdRaw) } : {}),
      ...(search ? { item: { is: { nameAr: { contains: search } } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { item: { select: { nameAr: true, unit: true, category: true } } },
  })

  return NextResponse.json({
    movements: movements.map(m => ({
      id: m.id, itemId: m.itemId, itemName: m.item.nameAr, unit: m.item.unit, category: m.item.category,
      type: m.type, quantity: m.quantity, date: m.date, reason: m.reason, recordedBy: m.recordedBy, createdAt: m.createdAt,
    })),
  })
}

// POST /api/staff/inventory/movements — record a stock-in/stock-out movement and adjust the item's quantity atomically
export async function POST(req: NextRequest) {
  try {
    const staff = await getStaffFromCookies()
    const b = await req.json()
    const itemId = parseInt(b.itemId)
    const type = b.type === 'in' || b.type === 'out' ? b.type : null
    const quantity = Number(b.quantity)

    if (!Number.isFinite(itemId)) return NextResponse.json({ error: 'الصنف غير محدد' }, { status: 400 })
    if (!type) return NextResponse.json({ error: 'نوع الحركة يجب أن يكون "وارد" أو "صادر"' }, { status: 400 })
    if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: 'الكمية يجب أن تكون أكبر من صفر' }, { status: 400 })
    if (!b.date?.trim()) return NextResponse.json({ error: 'التاريخ مطلوب' }, { status: 400 })

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 })
    if (type === 'out' && quantity > item.quantity) {
      return NextResponse.json({ error: `الكمية المطلوب صرفها (${quantity}) أكبر من الرصيد المتاح (${item.quantity} ${item.unit})` }, { status: 400 })
    }

    const delta = type === 'in' ? quantity : -quantity
    const [, updatedItem] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          itemId, type, quantity, date: b.date.trim(),
          reason: b.reason?.trim() || null,
          recordedBy: staff?.name ?? null,
        },
      }),
      prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: { increment: delta } } }),
    ])

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (err) {
    console.error('[staff/inventory/movements POST]', err)
    return NextResponse.json({ error: 'تعذّر تسجيل حركة المخزون' }, { status: 500 })
  }
}
