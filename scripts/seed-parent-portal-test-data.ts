/**
 * Seeds 10 demo students + matching, pre-approved parent-portal accounts
 * from MAS_Test_Parents_Students.xlsx — so the parent portal can be tried
 * immediately by logging in directly (no registration / admin-approval step).
 *
 * Safe to re-run: results are only created once per seat number, and parent
 * accounts are upserted by email.
 *
 * Run with:  npx tsx scripts/seed-parent-portal-test-data.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUBJECTS = [
  { nameAr: 'اللغة العربية', nameEn: 'Arabic Language' },
  { nameAr: 'الرياضيات', nameEn: 'Mathematics' },
  { nameAr: 'العلوم', nameEn: 'Sciences' },
  { nameAr: 'اللغة الإنجليزية', nameEn: 'English Language' },
  { nameAr: 'التربية الإسلامية', nameEn: 'Islamic Studies' },
  { nameAr: 'الدراسات الاجتماعية', nameEn: 'Social Studies' },
]

const GRADES_AR = [
  'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس',
  'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر',
]

function gradeFromDob(dob: string) {
  const birthYear = parseInt(dob.slice(0, 4), 10)
  const age = 2026 - birthYear
  const level = Math.min(Math.max(age - 6, 0), 11)
  return { ar: GRADES_AR[level], en: `Grade ${level + 1}` }
}

function calcLetterGrade(pct: number): string {
  if (pct >= 97) return 'A+'
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  if (pct >= 50) return 'E'
  return 'F'
}

// Deterministic "random" score generator (64-98) so re-runs are stable
function genScore(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  const frac = x - Math.floor(x)
  return Math.round(64 + frac * 34)
}

const rows = [
  { parentName: 'Ahmed Mohamed Hassan', phone: '01012345678', email: 'ahmed.hassan@test.com', password: 'MAS2026!', seat: '1001', studentNameAr: 'محمد أحمد حسن', dob: '2012-05-14', relationship: 'Father' },
  { parentName: 'Mona Ali Ibrahim', phone: '01023456789', email: 'mona.ibrahim@test.com', password: 'MAS2026!', seat: '1002', studentNameAr: 'سارة علي إبراهيم', dob: '2013-08-22', relationship: 'Mother' },
  { parentName: 'Khaled Samir Fouad', phone: '01034567890', email: 'khaled.fouad@test.com', password: 'MAS2026!', seat: '1003', studentNameAr: 'يوسف خالد فؤاد', dob: '2011-11-03', relationship: 'Father' },
  { parentName: 'Nadia Mahmoud Adel', phone: '01045678901', email: 'nadia.adel@test.com', password: 'MAS2026!', seat: '1004', studentNameAr: 'مريم محمود عادل', dob: '2014-01-17', relationship: 'Mother' },
  { parentName: 'Omar Tarek Amin', phone: '01056789012', email: 'omar.amin@test.com', password: 'MAS2026!', seat: '1005', studentNameAr: 'آدم عمر أمين', dob: '2012-09-09', relationship: 'Father' },
  { parentName: 'Rania Hossam Nabil', phone: '01067890123', email: 'rania.nabil@test.com', password: 'MAS2026!', seat: '1006', studentNameAr: 'ليلى حسام نبيل', dob: '2013-03-28', relationship: 'Mother' },
  { parentName: 'Mostafa Ahmed Saleh', phone: '01078901234', email: 'mostafa.saleh@test.com', password: 'MAS2026!', seat: '1007', studentNameAr: 'عمر مصطفى صالح', dob: '2011-07-12', relationship: 'Father' },
  { parentName: 'Dina Wael Farouk', phone: '01089012345', email: 'dina.farouk@test.com', password: 'MAS2026!', seat: '1008', studentNameAr: 'نور وائل فاروق', dob: '2014-10-30', relationship: 'Mother' },
  { parentName: 'Hany Sherif Kamal', phone: '01090123456', email: 'hany.kamal@test.com', password: 'MAS2026!', seat: '1009', studentNameAr: 'كريم هاني كمال', dob: '2012-12-05', relationship: 'Father' },
  { parentName: 'Salma Yasser Reda', phone: '01101234567', email: 'salma.reda@test.com', password: 'MAS2026!', seat: '1010', studentNameAr: 'جنى ياسر رضا', dob: '2013-06-19', relationship: 'Mother' },
]

async function main() {
  console.log('🌱 Seeding parent portal test data...\n')

  // Dedicated test semester so this never collides with real school data
  let semester = await prisma.semester.findFirst({ where: { nameEn: 'Parent Portal Test Data' } })
  if (!semester) {
    semester = await prisma.semester.create({
      data: {
        nameAr: 'بيانات تجريبية لبوابة أولياء الأمور',
        nameEn: 'Parent Portal Test Data',
        academicYear: '2025-2026',
        term: 'first',
        isPublished: true,
        publishedAt: new Date(),
      },
    })
    console.log(`✅ Created test semester "${semester.nameEn}" (id ${semester.id})\n`)
  } else {
    console.log(`ℹ️  Reusing existing test semester (id ${semester.id})\n`)
  }

  let newResults = 0, newParents = 0, refreshedParents = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const grade = gradeFromDob(row.dob)

    // Result — only create once per seat number in this semester (idempotent)
    const existingResult = await prisma.result.findUnique({
      where: { semesterId_seatNumber: { semesterId: semester.id, seatNumber: row.seat } },
    })

    if (!existingResult) {
      const subjects = SUBJECTS.map((s, j) => {
        const score = genScore(i * 13 + j * 7 + 3)
        const max = 100
        return { nameAr: s.nameAr, nameEn: s.nameEn, score, maxScore: max, passMark: max * 0.5, status: score >= max * 0.5 ? 'pass' : 'fail', orderIdx: j }
      })
      const totalScore = subjects.reduce((sum, s) => sum + s.score, 0)
      const maxScore = subjects.reduce((sum, s) => sum + s.maxScore, 0)
      const percentage = Math.round((totalScore / maxScore) * 1000) / 10
      const failCount = subjects.filter(s => s.status === 'fail').length
      const status = percentage >= 50 && failCount <= 2 ? 'pass' : 'fail'

      await prisma.result.create({
        data: {
          semesterId: semester.id,
          seatNumber: row.seat,
          nameAr: row.studentNameAr,
          gradeAr: grade.ar,
          gradeEn: grade.en,
          dateOfBirth: row.dob,
          totalScore, maxScore, percentage,
          status,
          letterGrade: calcLetterGrade(percentage),
          subjects: { create: subjects },
        },
      })
      newResults++
      console.log(`  ✅ ${row.studentNameAr} — seat ${row.seat} (${grade.ar}, ${percentage}% — ${status})`)
    } else {
      console.log(`  ℹ️  Seat ${row.seat} (${row.studentNameAr}) already has a result here — left as-is`)
    }

    // Parent account — pre-approved (isActive: true) so login works immediately
    const existingParent = await prisma.parentAccount.findUnique({ where: { email: row.email } })
    const hashedPw = await bcrypt.hash(row.password, 12)

    await prisma.parentAccount.upsert({
      where: { email: row.email },
      update: {
        name: row.parentName, password: hashedPw, phone: row.phone,
        seatNumber: row.seat, studentName: row.studentNameAr,
        gradeAr: grade.ar, gradeEn: grade.en, isActive: true,
      },
      create: {
        name: row.parentName, email: row.email, password: hashedPw, phone: row.phone,
        seatNumber: row.seat, studentName: row.studentNameAr,
        gradeAr: grade.ar, gradeEn: grade.en, isActive: true,
      },
    })
    existingParent ? refreshedParents++ : newParents++
  }

  console.log(`\n🎉 Done — ${newResults} new result(s) created, ${newParents} new parent account(s), ${refreshedParents} existing account(s) refreshed.\n`)
  console.log('📋 Log in at /parent/login with any of these (same password for all):\n')
  rows.forEach(r => console.log(`   ${r.email}   →   password: ${r.password}   (${r.studentNameAr}, seat ${r.seat})`))
  console.log('')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
