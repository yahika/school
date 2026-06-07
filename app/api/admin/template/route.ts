import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// GET /api/admin/template — download a blank Excel template
export async function GET() {
  const wb = XLSX.utils.book_new()

  // ── Main template sheet ────────────────────────────────────────────────────
  // Columns: A=seat, B=nameAr, C=nameEn, D=gradeAr, E=gradeEn, F=dob, G=parentPhone, H+=subjects
  const headers = [
    'رقم الجلوس',
    'الاسم بالعربي',
    'الاسم بالإنجليزي',
    'الصف (عربي)',
    'الصف (إنجليزي)',
    'تاريخ الميلاد (YYYY-MM-DD)',
    'رقم واتساب ولي الأمر',   // ← NEW: parent WhatsApp
    'اللغة العربية',
    'الرياضيات',
    'العلوم',
    'اللغة الإنجليزية',
    'التربية الإسلامية',
    'الدراسات الاجتماعية',
    'الحاسوب',
  ]

  const exampleRow = [
    '1001',
    'أحمد محمد',
    'Ahmed Mohammed',
    'الصف العاشر',
    'Grade 10',
    '2007-05-15',
    '+201012345678',           // ← parent phone example
    '85', '78', '90', '88', '95', '82', '75',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
  ws['!cols'] = headers.map((_, i) => ({ wch: i < 7 ? 26 : 18 }))

  XLSX.utils.book_append_sheet(wb, ws, 'النتائج')

  // ── Instructions sheet ─────────────────────────────────────────────────────
  const instructions = [
    ['تعليمات استخدام نموذج النتائج'],
    [''],
    ['الأعمدة الإلزامية:'],
    ['A', 'رقم الجلوس — يجب أن يكون فريداً لكل طالب'],
    ['B', 'الاسم بالعربي — كامل الاسم'],
    ['C', 'الاسم بالإنجليزي — اختياري'],
    ['D', 'الصف بالعربي — مثال: الصف العاشر'],
    ['E', 'الصف بالإنجليزي — اختياري'],
    ['F', 'تاريخ الميلاد — تنسيق YYYY-MM-DD مثال: 2007-05-15'],
    ['G', 'رقم واتساب ولي الأمر — مثال: +201012345678 (اختياري)'],
    [''],
    ['أعمدة المواد (من H فصاعداً):'],
    ['- ضع اسم المادة في السطر الأول (رأس العمود)'],
    ['- الدرجة في السطر التالي — من 0 إلى 100 افتراضياً'],
    ['- يمكن إضافة أي عدد من المواد'],
    [''],
    ['ملاحظات مهمة:'],
    ['- لا تغيّر ترتيب الأعمدة السبعة الأولى'],
    ['- الدرجة القصوى الافتراضية 100 — تُحسب النسبة تلقائياً'],
    ['- حد النجاح 50% للمادة و50% للمجموع الكلي'],
    ['- رقم الواتساب يُستخدم لإرسال النتيجة تلقائياً عند النشر'],
  ]

  const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
  wsInstr['!cols'] = [{ wch: 5 }, { wch: 65 }]
  XLSX.utils.book_append_sheet(wb, wsInstr, 'التعليمات')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="school-results-template.xlsx"',
    },
  })
}
