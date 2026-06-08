import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/staff/inventory/overview — dashboard summary stats for the inventory portal
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany()

    const totalItems = items.length
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
    const lowStockItemsAll = items.filter(i => i.quantity <= i.minThreshold)
    const estimatedValue = items.reduce((sum, i) => sum + (i.unitPrice ? i.unitPrice * i.quantity : 0), 0)

    const byCategory = new Map<string, { itemCount: number; totalQuantity: number }>()
    for (const i of items) {
      const entry = byCategory.get(i.category) ?? { itemCount: 0, totalQuantity: 0 }
      entry.itemCount += 1
      entry.totalQuantity += i.quantity
      byCategory.set(i.category, entry)
    }
    const categoryBreakdown = Array.from(byCategory.entries()).map(([category, v]) => ({ category, ...v }))

    const lowStockItems = lowStockItemsAll
      .sort((a, b) => (a.quantity - a.minThreshold) - (b.quantity - b.minThreshold))
      .slice(0, 8)
      .map(i => ({ id: i.id, nameAr: i.nameAr, category: i.category, quantity: i.quantity, unit: i.unit, minThreshold: i.minThreshold }))

    const recent = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { item: { select: { nameAr: true, unit: true } } },
    })

    return NextResponse.json({
      totalItems,
      totalQuantity,
      lowStockCount: lowStockItemsAll.length,
      estimatedValue,
      categoryBreakdown,
      lowStockItems,
      recentMovements: recent.map(m => ({
        id: m.id, itemName: m.item.nameAr, unit: m.item.unit, type: m.type, quantity: m.quantity, date: m.date, reason: m.reason,
      })),
    })
  } catch (err) {
    console.error('[staff/inventory/overview GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
