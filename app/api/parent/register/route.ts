import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, seatNumber, studentNameAr, dateOfBirth } = await req.json()

    if (!name || !email || !password || !seatNumber || !studentNameAr || !dateOfBirth || !phone)
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب تعبئتها' }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })

    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

    // ── Step 1: Verify seat number exists in results ──────────────────────────
    const result = await prisma.result.findFirst({
      where: { seatNumber },
      orderBy: { createdAt: 'desc' },
    })
    if (!result)
      return NextResponse.json({ error: 'رقم الجلوس غير موجود — تأكد من الرقم أو تواصل مع الإدارة' }, { status: 404 })

    // ── Step 2: Verify student full name matches exactly ─────────────────────
    if (normalize(result.nameAr) !== normalize(studentNameAr))
      return NextResponse.json({ error: 'اسم الطالب لا يطابق السجلات — تأكد من الكتابة الكاملة بالعربية' }, { status: 401 })

    // ── Step 3: Verify date of birth ─────────────────────────────────────────
    if (result.dateOfBirth && result.dateOfBirth !== dateOfBirth)
      return NextResponse.json({ error: 'تاريخ ميلاد الطالب غير صحيح' }, { status: 401 })

    // ── Step 4: Verify parent phone matches application record ────────────────
    const normalizePhone = (p: string) => p.replace(/[\s\-\+]/g, '')
    const application = await prisma.application.findFirst({
      where: { studentNameAr: { contains: normalize(studentNameAr).split(' ')[0] } },
      orderBy: { createdAt: 'desc' },
    })

    if (application) {
      // An application exists — phone must match
      const appPhone = normalizePhone(application.parentPhone)
      const inputPhone = normalizePhone(phone)
      const appEmail = application.parentEmail?.toLowerCase().trim()
      const inputEmail = email.toLowerCase().trim()

      const phoneMatches = appPhone === inputPhone
      const emailMatches = appEmail && appEmail === inputEmail

      if (!phoneMatches && !emailMatches) {
        return NextResponse.json({
          error: 'رقم الهاتف أو البريد الإلكتروني لا يطابق بيانات ولي الأمر المسجلة في الطلب — إذا كان لديك طلب قبول، استخدم نفس رقم الهاتف أو البريد الإلكتروني الذي أدخلته في الطلب',
        }, { status: 401 })
      }
    }
    // If no application exists, we skip phone verification (student enrolled directly)

    // ── Step 5: Check no duplicate account ───────────────────────────────────
    const existingEmail = await prisma.parentAccount.findUnique({ where: { email } })
    if (existingEmail)
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })

    const existingSeat = await prisma.parentAccount.findFirst({ where: { seatNumber } })
    if (existingSeat)
      return NextResponse.json({ error: 'حساب ولي أمر لهذا الطالب موجود بالفعل — تواصل مع الإدارة إذا كنت ولي الأمر الفعلي' }, { status: 409 })

    // ── Create account (pending admin approval) ───────────────────────────────
    const hashed = await bcrypt.hash(password, 12)
    const parent = await prisma.parentAccount.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        seatNumber,
        studentName: result.nameAr,
        gradeAr: result.gradeAr,
        gradeEn: result.gradeEn ?? '',
        isActive: false, // Admin must approve
      },
    })

    return NextResponse.json({
      success: true,
      parentId: parent.id,
      studentName: result.nameAr,
      pending: true,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
