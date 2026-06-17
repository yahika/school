import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.stockMovement.deleteMany()
  await prisma.inventoryItem.deleteMany()

  const items = await prisma.inventoryItem.createMany({ data: [
    // Books
    { nameAr: 'كتاب الرياضيات الصف الأول',            nameEn: 'Math Book Grade 1',           category: 'كتب',              unit: 'نسخة',      quantity: 120, minThreshold: 20, unitPrice: 45,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب العلوم الصف الثالث',              nameEn: 'Science Book Grade 3',        category: 'كتب',              unit: 'نسخة',      quantity: 100, minThreshold: 20, unitPrice: 45,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب العربي الصف الخامس',              nameEn: 'Arabic Book Grade 5',         category: 'كتب',              unit: 'نسخة',      quantity: 95,  minThreshold: 20, unitPrice: 40,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الإنجليزي الصف السادس',           nameEn: 'English Book Grade 6',        category: 'كتب',              unit: 'نسخة',      quantity: 90,  minThreshold: 20, unitPrice: 55,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الكيمياء الصف الأول الثانوي',     nameEn: 'Chemistry Book Grade 10',     category: 'كتب',              unit: 'نسخة',      quantity: 70,  minThreshold: 15, unitPrice: 60,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الفيزياء الصف الثالث الثانوي',    nameEn: 'Physics Book Grade 12',       category: 'كتب',              unit: 'نسخة',      quantity: 65,  minThreshold: 15, unitPrice: 60,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الرياضيات الصف الثالث الثانوي',   nameEn: 'Math Book Grade 12',          category: 'كتب',              unit: 'نسخة',      quantity: 12,  minThreshold: 20, unitPrice: 65,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب العربي الصف الثالث الثانوي',      nameEn: 'Arabic Book Grade 12',        category: 'كتب',              unit: 'نسخة',      quantity: 9,   minThreshold: 15, unitPrice: 40,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الحاسوب الصف الخامس',             nameEn: 'CS Book Grade 5',             category: 'كتب',              unit: 'نسخة',      quantity: 110, minThreshold: 20, unitPrice: 50,  supplier: 'دار المعارف' },
    { nameAr: 'كتاب الدراسات الاجتماعية الإعدادي',    nameEn: 'Social Studies Prep',         category: 'كتب',              unit: 'نسخة',      quantity: 88,  minThreshold: 15, unitPrice: 40,  supplier: 'دار المعارف' },
    // Uniform
    { nameAr: 'قميص أبيض مقاس S',                     nameEn: 'White Shirt Size S',          category: 'يونيفورم',         unit: 'قطعة',      quantity: 80,  minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس M',                     nameEn: 'White Shirt Size M',          category: 'يونيفورم',         unit: 'قطعة',      quantity: 100, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس L',                     nameEn: 'White Shirt Size L',          category: 'يونيفورم',         unit: 'قطعة',      quantity: 90,  minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس XL',                    nameEn: 'White Shirt Size XL',         category: 'يونيفورم',         unit: 'قطعة',      quantity: 60,  minThreshold: 10, unitPrice: 130, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'بنطلون رمادي مقاس M',                  nameEn: 'Grey Trousers Size M',        category: 'يونيفورم',         unit: 'قطعة',      quantity: 8,   minThreshold: 20, unitPrice: 150, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'بنطلون رمادي مقاس L',                  nameEn: 'Grey Trousers Size L',        category: 'يونيفورم',         unit: 'قطعة',      quantity: 45,  minThreshold: 15, unitPrice: 150, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'تيشيرت رياضي أزرق مقاس M',             nameEn: 'Blue Sports T-Shirt M',       category: 'يونيفورم',         unit: 'قطعة',      quantity: 55,  minThreshold: 10, unitPrice: 90,  supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'حذاء مدرسي أسود مقاس 36',              nameEn: 'Black School Shoe Size 36',   category: 'يونيفورم',         unit: 'زوج',       quantity: 30,  minThreshold: 10, unitPrice: 250, supplier: 'مصنع الأزياء المدرسية' },
    // Stationery
    { nameAr: 'دفتر كبير',                            nameEn: 'Large Notebook',              category: 'قرطاسية',          unit: 'قطعة',      quantity: 500, minThreshold: 50, unitPrice: 8,   supplier: 'مستلزمات القلم' },
    { nameAr: 'دفتر صغير',                            nameEn: 'Small Notebook',              category: 'قرطاسية',          unit: 'قطعة',      quantity: 350, minThreshold: 40, unitPrice: 5,   supplier: 'مستلزمات القلم' },
    { nameAr: 'قلم رصاص',                             nameEn: 'Pencil',                      category: 'قرطاسية',          unit: 'قطعة',      quantity: 300, minThreshold: 50, unitPrice: 2,   supplier: 'مستلزمات القلم' },
    { nameAr: 'قلم حبر أزرق',                         nameEn: 'Blue Pen',                    category: 'قرطاسية',          unit: 'قطعة',      quantity: 250, minThreshold: 50, unitPrice: 3,   supplier: 'مستلزمات القلم' },
    { nameAr: 'ممحاة',                                nameEn: 'Eraser',                      category: 'قرطاسية',          unit: 'قطعة',      quantity: 200, minThreshold: 30, unitPrice: 1,   supplier: 'مستلزمات القلم' },
    { nameAr: 'مسطرة 30 سم',                          nameEn: '30cm Ruler',                  category: 'قرطاسية',          unit: 'قطعة',      quantity: 150, minThreshold: 30, unitPrice: 5,   supplier: 'مستلزمات القلم' },
    { nameAr: 'أقلام ملونة',                          nameEn: 'Colored Pencils',             category: 'قرطاسية',          unit: 'علبة',      quantity: 120, minThreshold: 20, unitPrice: 15,  supplier: 'مستلزمات القلم' },
    { nameAr: 'برّاية',                               nameEn: 'Pencil Sharpener',            category: 'قرطاسية',          unit: 'قطعة',      quantity: 180, minThreshold: 30, unitPrice: 2,   supplier: 'مستلزمات القلم' },
    // Office supplies
    { nameAr: 'ورق A4 (رزمة)',                        nameEn: 'A4 Paper Ream',               category: 'مستلزمات مكتبية', unit: 'رزمة',      quantity: 60,  minThreshold: 10, unitPrice: 45,  supplier: 'مستودع الكتابة' },
    { nameAr: 'حبر طابعة أسود',                       nameEn: 'Black Printer Ink',           category: 'مستلزمات مكتبية', unit: 'كارتريدج', quantity: 8,   minThreshold: 3,  unitPrice: 180, supplier: 'مستودع الكتابة' },
    { nameAr: 'مناديل ورقية (كرتونة)',               nameEn: 'Paper Tissues Box',           category: 'مستلزمات مكتبية', unit: 'كرتونة',   quantity: 25,  minThreshold: 5,  unitPrice: 80,  supplier: 'مستودع الكتابة' },
    // Cleaning
    { nameAr: 'صابون سائل (5 لتر)',                   nameEn: 'Liquid Soap 5L',              category: 'نظافة',            unit: 'جركن',     quantity: 14,  minThreshold: 4,  unitPrice: 60,  supplier: 'مستودع النظافة' },
    { nameAr: 'مطهر أرضيات (جركن)',                  nameEn: 'Floor Cleaner Jerrycan',      category: 'نظافة',            unit: 'جركن',     quantity: 10,  minThreshold: 3,  unitPrice: 75,  supplier: 'مستودع النظافة' },
  ]})
  console.log('Created', items.count, 'inventory items')
}

main().catch(console.error).finally(() => prisma.$disconnect())
