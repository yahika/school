import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function calcStatus(score: number, max: number): string {
  return score >= max * 0.5 ? 'pass' : 'fail'
}

function deterministicScore(seatNum: number, subjectIdx: number): number {
  const seed   = (seatNum * 17 + subjectIdx * 31) % 100
  const bucket = (seatNum + subjectIdx * 7) % 10
  if (bucket === 0) return 20 + (seed % 30)
  if (bucket <= 2)  return 50 + (seed % 15)
  if (bucket <= 4)  return 85 + (seed % 16)
  return 65 + (seed % 20)
}

// ─── Static data (unchanged from original seed) ───────────────────────────────

const GRADES = [
  { ar: 'الصف الأول الابتدائي',      en: 'Grade 1 Primary',      birthYear: 2018 },
  { ar: 'الصف الثالث الابتدائي',     en: 'Grade 3 Primary',      birthYear: 2016 },
  { ar: 'الصف الخامس الابتدائي',     en: 'Grade 5 Primary',      birthYear: 2014 },
  { ar: 'الصف السادس الابتدائي',     en: 'Grade 6 Primary',      birthYear: 2013 },
  { ar: 'الصف الأول الإعدادي',       en: 'Grade 7 Preparatory',  birthYear: 2012 },
  { ar: 'الصف الثالث الإعدادي',      en: 'Grade 9 Preparatory',  birthYear: 2010 },
  { ar: 'الصف الأول الثانوي',        en: 'Grade 10 Secondary',   birthYear: 2009 },
  { ar: 'الصف الثالث الثانوي',       en: 'Grade 12 Secondary',   birthYear: 2007 },
]

const MALE_FIRST    = ['أحمد', 'محمد', 'خالد', 'عمر', 'يوسف', 'إبراهيم', 'عبدالله', 'مصطفى', 'عمرو']
const FEMALE_FIRST  = ['سارة', 'فاطمة', 'نورا', 'هند', 'لينا', 'ريم', 'مريم', 'أميرة', 'شيماء']
const LAST_NAMES    = ['محمد', 'أحمد', 'السيد', 'الشريف', 'الغزالي', 'المصري', 'حسن', 'منصور', 'شاهين', 'رشاد']

const MALE_FIRST_EN   = ['Ahmed', 'Mohamed', 'Khaled', 'Omar', 'Youssef', 'Ibrahim', 'Abdullah', 'Mostafa', 'Amr']
const FEMALE_FIRST_EN = ['Sara', 'Fatma', 'Nora', 'Hend', 'Lina', 'Reem', 'Mariam', 'Amira', 'Shimaa']
const LAST_NAMES_EN   = ['Mohamed', 'Ahmed', 'El-Sayed', 'El-Sharif', 'El-Ghazaly', 'El-Masry', 'Hassan', 'Mansour', 'Shahin', 'Rashad']

const SUBJECTS = [
  { ar: 'اللغة العربية',        en: 'Arabic Language'   },
  { ar: 'الرياضيات',            en: 'Mathematics'       },
  { ar: 'العلوم',               en: 'Science'           },
  { ar: 'اللغة الإنجليزية',     en: 'English Language'  },
  { ar: 'التربية الإسلامية',    en: 'Islamic Education' },
  { ar: 'الدراسات الاجتماعية',  en: 'Social Studies'    },
  { ar: 'الحاسوب',              en: 'Computer Science'  },
  { ar: 'التربية الفنية',       en: 'Art Education'     },
]

// ─── Student builder for results (original 72, seats 1001-1072) ───────────────

interface Student {
  seatNumber: string; nameAr: string; nameEn: string
  gradeAr: string; gradeEn: string; gradeIdx: number
  dateOfBirth: string; isFemale: boolean
}

function buildResultStudents(): Student[] {
  const students: Student[] = []
  let seatCounter = 1001
  for (let g = 0; g < 8; g++) {
    const grade = GRADES[g]
    for (let i = 0; i < 9; i++) {
      const isFemale = (i % 3 === 2)
      const nameIdx  = i % 9
      const lastIdx  = (g * 9 + i) % 10
      const firstAr  = isFemale ? FEMALE_FIRST[nameIdx]    : MALE_FIRST[nameIdx]
      const lastAr   = LAST_NAMES[lastIdx]
      const firstEn  = isFemale ? FEMALE_FIRST_EN[nameIdx] : MALE_FIRST_EN[nameIdx]
      const lastEn   = LAST_NAMES_EN[lastIdx]
      const month    = ((g * 9 + i) % 12) + 1
      const day      = ((i * 7 + g * 3) % 28) + 1
      students.push({
        seatNumber: String(seatCounter++),
        nameAr: `${firstAr} ${lastAr}`,
        nameEn: `${firstEn} ${lastEn}`,
        gradeAr: grade.ar, gradeEn: grade.en, gradeIdx: g,
        dateOfBirth: `${grade.birthYear}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        isFemale,
      })
    }
  }
  return students
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database from Excel data...')

  // ── Load Excel-derived data ─────────────────────────────────────────────────
  const dataPath = path.join(__dirname, 'seed_excel_data.json')
  const excelData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const { students: excelStudents, fees: excelFees, expenses: excelExpenses, apps: excelApps, parents: excelParents } = excelData

  // ── Hash passwords ──────────────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash('Admin@2024!',  10)
  const staffHash  = await bcrypt.hash('Staff@2024!',  10)
  const parentHash = await bcrypt.hash('Parent@2024!', 10)

  // ── 1. Clear replaced data (keep results, buses, inventory, announcements) ──
  console.log('  Clearing replaced data...')
  await prisma.stockMovement.deleteMany()
  await prisma.busRider.deleteMany()         // riders referenced old seat numbers
  await prisma.attendanceRecord.deleteMany() // referenced old seat numbers
  await prisma.conductNote.deleteMany()      // referenced old seat numbers
  await prisma.feeRecord.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.application.deleteMany()
  await prisma.parentAccount.deleteMany()
  await prisma.studentFile.deleteMany()      // replace with Excel students

  // ── 2. Admin ────────────────────────────────────────────────────────────────
  console.log('  Upserting admin...')
  await prisma.admin.upsert({
    where:  { username: 'admin' },
    update: { password: adminHash },
    create: { username: 'admin', password: adminHash },
  })

  // ── 3. Staff ────────────────────────────────────────────────────────────────
  console.log('  Upserting staff...')
  const staffData = [
    { username: 'affairs_staff',   name: 'محمود رشاد',          department: 'student_affairs' },
    { username: 'buses_staff',     name: 'طارق منصور',           department: 'buses'           },
    { username: 'accounts_staff',  name: 'نادية السيد',          department: 'accounts'        },
    { username: 'control_staff',   name: 'هاني الغزالي',         department: 'results_control' },
    { username: 'inventory_staff', name: 'سامي شاهين',           department: 'inventory'       },
    { username: 'principal',       name: 'د. أحمد الشريف',       department: 'principal'       },
    { username: 'owner',           name: 'المهندس خالد المصري',  department: 'owner'           },
  ]
  for (const s of staffData) {
    await prisma.staff.upsert({
      where:  { username: s.username },
      update: { password: staffHash, name: s.name, department: s.department },
      create: { ...s, password: staffHash },
    })
  }

  // ── 4. Semesters + reviews (keep existing results) ──────────────────────────
  console.log('  Upserting semesters...')
  const sem1 = await prisma.semester.upsert({
    where:  { id: 1 },
    update: { nameAr: 'الفصل الدراسي الأول 2024/2025', nameEn: 'First Semester 2024/2025', academicYear: '2024-2025', term: 'term1', isPublished: true, publishedAt: new Date('2025-01-20') },
    create: { id: 1, nameAr: 'الفصل الدراسي الأول 2024/2025', nameEn: 'First Semester 2024/2025', academicYear: '2024-2025', term: 'term1', isPublished: true, publishedAt: new Date('2025-01-20') },
  })
  const sem2 = await prisma.semester.upsert({
    where:  { id: 2 },
    update: { nameAr: 'الفصل الدراسي الثاني 2024/2025', nameEn: 'Second Semester 2024/2025', academicYear: '2024-2025', term: 'term2', isPublished: true, publishedAt: new Date('2025-06-15') },
    create: { id: 2, nameAr: 'الفصل الدراسي الثاني 2024/2025', nameEn: 'Second Semester 2024/2025', academicYear: '2024-2025', term: 'term2', isPublished: true, publishedAt: new Date('2025-06-15') },
  })
  for (const sem of [sem1, sem2]) {
    await prisma.resultReview.upsert({
      where:  { semesterId: sem.id },
      update: { status: 'approved', reviewedBy: 'هاني الغزالي', reviewedAt: new Date() },
      create: { semesterId: sem.id, status: 'approved', reviewedBy: 'هاني الغزالي', reviewedAt: new Date() },
    })
  }

  // ── 5. Results (original 72 students, seats 1001-1072) ──────────────────────
  console.log('  Upserting results for 72 students (seats 1001-1072)...')
  const resultStudents = buildResultStudents()
  for (const st of resultStudents) {
    const sn = parseInt(st.seatNumber)
    for (const sem of [sem1, sem2]) {
      const termOffset = sem.id === 1 ? 0 : 3
      const subjectScores = SUBJECTS.map((subj, idx) => {
        const score = deterministicScore(sn + termOffset, idx)
        return { nameAr: subj.ar, nameEn: subj.en, score, maxScore: 100, passMark: 50, status: calcStatus(score, 100), orderIdx: idx }
      })
      const totalScore = subjectScores.reduce((a, b) => a + b.score, 0)
      const maxScore   = SUBJECTS.length * 100
      const percentage = (totalScore / maxScore) * 100
      const existing = await prisma.result.findUnique({
        where: { semesterId_seatNumber: { semesterId: sem.id, seatNumber: st.seatNumber } },
        select: { id: true },
      })
      if (existing) {
        await prisma.subject.deleteMany({ where: { resultId: existing.id } })
        await prisma.result.update({
          where: { id: existing.id },
          data: {
            nameAr: st.nameAr, nameEn: st.nameEn, gradeAr: st.gradeAr, gradeEn: st.gradeEn,
            dateOfBirth: st.dateOfBirth, totalScore, maxScore, percentage,
            status: percentage >= 50 ? 'pass' : 'fail',
            letterGrade: calcLetterGrade(percentage),
            subjects: { create: subjectScores },
          },
        })
      } else {
        await prisma.result.create({
          data: {
            semesterId: sem.id, seatNumber: st.seatNumber,
            nameAr: st.nameAr, nameEn: st.nameEn, gradeAr: st.gradeAr, gradeEn: st.gradeEn,
            dateOfBirth: st.dateOfBirth, totalScore, maxScore, percentage,
            status: percentage >= 50 ? 'pass' : 'fail',
            letterGrade: calcLetterGrade(percentage),
            subjects: { create: subjectScores },
          },
        })
      }
    }
  }

  // ── 6. Student Files (524 from Excel) ───────────────────────────────────────
  console.log(`  Creating ${excelStudents.length} student files from Excel...`)
  await prisma.studentFile.createMany({ data: excelStudents, skipDuplicates: true })

  // ── 7. Fee Records (524 from Excel) ─────────────────────────────────────────
  console.log(`  Creating ${excelFees.length} fee records from Excel...`)
  const feeRows = excelFees.map((f: { studentName: string; seatNumber: string; gradeAr: string; amount: number; isPaid: boolean; academicYear: string }, idx: number) => ({
    studentName: f.studentName,
    seatNumber:  f.seatNumber,
    gradeAr:     f.gradeAr,
    amount:      f.amount,
    isPaid:      f.isPaid,
    paidAt:      f.isPaid ? new Date(2025, 8 + Math.floor(idx / 60), (idx % 28) + 1) : null,
    academicYear: f.academicYear,
    notes:       f.isPaid ? 'تم السداد' : null,
  }))
  await prisma.feeRecord.createMany({ data: feeRows, skipDuplicates: true })

  // ── 8. Expenses (34 from Excel) ─────────────────────────────────────────────
  console.log(`  Creating ${excelExpenses.length} expenses from Excel...`)
  await prisma.expense.createMany({ data: excelExpenses })

  // ── 9. Applications (44 from Excel) ─────────────────────────────────────────
  console.log(`  Creating ${excelApps.length} applications from Excel...`)
  await prisma.application.createMany({ data: excelApps })

  // ── 10. Parent Accounts (524 from Excel, with hashed password) ──────────────
  console.log(`  Creating ${excelParents.length} parent accounts from Excel...`)
  // createMany won't hash passwords, so batch manually in chunks of 50
  const CHUNK = 50
  for (let i = 0; i < excelParents.length; i += CHUNK) {
    const chunk = excelParents.slice(i, i + CHUNK)
    await prisma.parentAccount.createMany({
      data: chunk.map((p: { name: string; email: string; phone: string; seatNumber: string; studentName: string; gradeAr: string; gradeEn: string; isActive: boolean }) => ({
        ...p, password: parentHash,
      })),
      skipDuplicates: true,
    })
    if (i % 200 === 0) console.log(`    parents: ${Math.min(i + CHUNK, excelParents.length)}/${excelParents.length}`)
  }

  // ── 11. Buses (keep fleet, re-add riders from Excel students) ───────────────
  console.log('  Upserting buses...')
  const busesData = [
    { code: 'BUS-01', routeAr: 'سيدي بشر - المنتزه',       driverName: 'محمد السيد',   driverPhone: '01012345601', capacity: 45, status: 'active'      },
    { code: 'BUS-02', routeAr: 'سيدي جابر - محطة الرمل',   driverName: 'عادل حسن',     driverPhone: '01012345602', capacity: 40, status: 'active'      },
    { code: 'BUS-03', routeAr: 'العجمي - الهانوفيل',        driverName: 'كريم إبراهيم', driverPhone: '01012345603', capacity: 38, status: 'maintenance' },
    { code: 'BUS-04', routeAr: 'الدخيلة - برج العرب',       driverName: 'سامر عبدالله', driverPhone: '01012345604', capacity: 42, status: 'active'      },
    { code: 'BUS-05', routeAr: 'كليوباترا - مصطفى كامل',   driverName: 'أشرف محمود',   driverPhone: '01012345605', capacity: 35, status: 'active'      },
  ]
  const busIds: Record<string, number> = {}
  for (const b of busesData) {
    const bus = await prisma.bus.upsert({
      where:  { code: b.code },
      update: { routeAr: b.routeAr, driverName: b.driverName, driverPhone: b.driverPhone, capacity: b.capacity, status: b.status, monthlyFee: 500 },
      create: { ...b, monthlyFee: 500 },
    })
    busIds[b.code] = bus.id
  }

  // Assign Excel students to buses (active buses only, cap at capacity)
  const activeBusCodes = ['BUS-01', 'BUS-02', 'BUS-04', 'BUS-05']
  const ridersPerBus   = [45, 40, 42, 35]  // fill to capacity
  const busRiderRows: {
    busId: number; seatNumber: string; studentName: string; gradeAr: string
    pickupPoint: string; phone: string; isActive: boolean
  }[] = []
  let offset = 0
  for (let bi = 0; bi < activeBusCodes.length; bi++) {
    const busId = busIds[activeBusCodes[bi]]
    const count = ridersPerBus[bi]
    for (let ri = 0; ri < count && offset + ri < excelStudents.length; ri++) {
      const st = excelStudents[offset + ri]
      busRiderRows.push({
        busId, seatNumber: st.seatNumber, studentName: st.nameEn,
        gradeAr: st.gradeAr, pickupPoint: `محطة ${ri + 1}`,
        phone: st.guardianPhone, isActive: true,
      })
    }
    offset += count
  }
  await prisma.busRider.createMany({ data: busRiderRows })
  console.log(`  Added ${busRiderRows.length} bus riders from Excel students`)

  // ── 12. Inventory (keep existing — not in Excel) ─────────────────────────────
  const existingInventory = await prisma.inventoryItem.count()
  if (existingInventory === 0) {
    console.log('  Creating inventory items...')
    await prisma.inventoryItem.createMany({
      data: [
        { nameAr: 'كتاب الرياضيات الصف الأول', nameEn: 'Math Book Grade 1', category: 'كتب', unit: 'نسخة', quantity: 120, minThreshold: 20, unitPrice: 45, supplier: 'دار المعارف' },
        { nameAr: 'كتاب العلوم الصف الثالث', nameEn: 'Science Book Grade 3', category: 'كتب', unit: 'نسخة', quantity: 100, minThreshold: 20, unitPrice: 45, supplier: 'دار المعارف' },
        { nameAr: 'كتاب العربي الصف الخامس', nameEn: 'Arabic Book Grade 5', category: 'كتب', unit: 'نسخة', quantity: 95, minThreshold: 20, unitPrice: 40, supplier: 'دار المعارف' },
        { nameAr: 'كتاب الإنجليزي الصف السادس', nameEn: 'English Book Grade 6', category: 'كتب', unit: 'نسخة', quantity: 90, minThreshold: 20, unitPrice: 55, supplier: 'دار المعارف' },
        { nameAr: 'كتاب الرياضيات الصف الثالث الثانوي', nameEn: 'Math Book Grade 12', category: 'كتب', unit: 'نسخة', quantity: 12, minThreshold: 20, unitPrice: 65, supplier: 'دار المعارف' },
        { nameAr: 'كتاب العربي الصف الثالث الثانوي', nameEn: 'Arabic Book Grade 12', category: 'كتب', unit: 'نسخة', quantity: 9, minThreshold: 15, unitPrice: 40, supplier: 'دار المعارف' },
        { nameAr: 'قميص أبيض مقاس S', nameEn: 'White Shirt Size S', category: 'يونيفورم', unit: 'قطعة', quantity: 80, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
        { nameAr: 'قميص أبيض مقاس M', nameEn: 'White Shirt Size M', category: 'يونيفورم', unit: 'قطعة', quantity: 100, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
        { nameAr: 'قميص أبيض مقاس L', nameEn: 'White Shirt Size L', category: 'يونيفورم', unit: 'قطعة', quantity: 90, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
        { nameAr: 'بنطلون رمادي', nameEn: 'Grey Trousers', category: 'يونيفورم', unit: 'قطعة', quantity: 8, minThreshold: 20, unitPrice: 150, supplier: 'مصنع الأزياء المدرسية' },
        { nameAr: 'دفتر كبير', nameEn: 'Large Notebook', category: 'قرطاسية', unit: 'قطعة', quantity: 500, minThreshold: 50, unitPrice: 8, supplier: 'مستلزمات القلم' },
        { nameAr: 'قلم رصاص', nameEn: 'Pencil', category: 'قرطاسية', unit: 'قطعة', quantity: 300, minThreshold: 50, unitPrice: 2, supplier: 'مستلزمات القلم' },
        { nameAr: 'ممحاة', nameEn: 'Eraser', category: 'قرطاسية', unit: 'قطعة', quantity: 200, minThreshold: 30, unitPrice: 1, supplier: 'مستلزمات القلم' },
        { nameAr: 'أقلام ملونة', nameEn: 'Colored Pencils', category: 'قرطاسية', unit: 'قطعة', quantity: 120, minThreshold: 20, unitPrice: 15, supplier: 'مستلزمات القلم' },
      ],
    })
  } else {
    console.log(`  Keeping existing ${existingInventory} inventory items`)
  }

  // ── 13. Attendance (fresh for Excel students) ─────────────────────────────────
  console.log('  Creating attendance records for Excel students...')
  const schoolDays = ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-14', '2026-06-15', '2026-06-16']
  const attendanceRows: {
    seatNumber: string; studentName: string; gradeAr: string; date: string; status: string; recordedBy: string
  }[] = []
  for (const day of schoolDays) {
    for (const st of excelStudents) {
      const seed = (parseInt(st.seatNumber) + day.charCodeAt(8) * 7) % 100
      let status: string
      if      (seed < 2)  status = 'excused'
      else if (seed < 5)  status = 'late'
      else if (seed < 10) status = 'absent'
      else                status = 'present'
      attendanceRows.push({ seatNumber: st.seatNumber, studentName: st.nameEn, gradeAr: st.gradeAr, date: day, status, recordedBy: 'محمود رشاد' })
    }
  }
  await prisma.attendanceRecord.createMany({ data: attendanceRows, skipDuplicates: true })
  console.log(`  Created ${attendanceRows.length} attendance records`)

  // ── 14. Conduct notes (for Excel students) ───────────────────────────────────
  console.log('  Creating conduct notes...')
  const conductTemplates = [
    { type: 'positive', description: 'تفوق ملحوظ في مادة الرياضيات'                 },
    { type: 'positive', description: 'مشاركة فعالة ومتميزة في الفصل'               },
    { type: 'positive', description: 'سلوك مثالي وانضباط تام'                      },
    { type: 'positive', description: 'إبداع ملحوظ في مشروع الحاسوب'                },
    { type: 'positive', description: 'التزام بالواجبات المنزلية باستمرار'            },
    { type: 'negative', description: 'تأخر متكرر عن موعد الحضور'                  },
    { type: 'negative', description: 'مشاجرة مع زميل في الفناء'                    },
    { type: 'negative', description: 'إهمال الواجبات المنزلية لأسبوع كامل'          },
    { type: 'negative', description: 'الغياب بدون عذر مقبول'                       },
    { type: 'negative', description: 'استخدام الهاتف المحمول أثناء الحصص'         },
    { type: 'note',     description: 'يحتاج متابعة خاصة في اللغة الإنجليزية'       },
    { type: 'note',     description: 'تم التواصل مع ولي الأمر بشأن الغياب المتكرر' },
    { type: 'note',     description: 'طالب يحتاج دعم نفسي واجتماعي'                },
    { type: 'positive', description: 'حصل على المركز الأول في مسابقة العلوم'        },
    { type: 'negative', description: 'عدم الالتزام بزي المدرسة'                    },
    { type: 'note',     description: 'تم التواصل مع ولي الأمر بشأن التحصيل الدراسي' },
    { type: 'positive', description: 'مساعدة زملائه في الفهم والاستيعاب'            },
    { type: 'negative', description: 'الخروج من الفصل دون إذن من المعلم'           },
    { type: 'positive', description: 'تقديم مشروع ممتاز في التربية الفنية'          },
    { type: 'negative', description: 'الحديث بصوت مرتفع أثناء الحصة'              },
  ]
  const conductRows = conductTemplates.map((c, i) => {
    const st = excelStudents[(i * 26 + 7) % excelStudents.length]
    const d  = new Date('2026-06-17')
    d.setDate(d.getDate() - (i + 1))
    return { seatNumber: st.seatNumber, studentName: st.nameEn, gradeAr: st.gradeAr, date: d.toISOString().split('T')[0], type: c.type, description: c.description, recordedBy: 'محمود رشاد' }
  })
  await prisma.conductNote.createMany({ data: conductRows })

  // ── 15. Announcements (keep/recreate) ────────────────────────────────────────
  const existingAnn = await prisma.announcement.count()
  if (existingAnn === 0) {
    console.log('  Creating announcements...')
    await prisma.announcement.createMany({
      data: [
        { titleAr: 'جدول امتحانات نهاية الفصل الدراسي الثاني', titleEn: 'Second Semester Final Exam Schedule', bodyAr: 'يسر إدارة المدرسة إعلان جدول امتحانات نهاية الفصل الدراسي الثاني لعام 2024/2025. تبدأ الامتحانات يوم السبت 8 يونيو 2025.', bodyEn: 'The school administration announces the second semester final exam schedule for 2024/2025. Exams begin Saturday, June 8, 2025.', isPublished: true, publishedAt: new Date('2025-05-25') },
        { titleAr: 'تهنئة المتفوقين في الفصل الدراسي الأول', titleEn: 'Congratulations to Top Students', bodyAr: 'تتقدم إدارة المدرسة بخالص التهاني للطلاب الحاصلين على تقدير ممتاز في الفصل الأول 2024/2025.', bodyEn: 'The school administration congratulates all students who achieved excellent grades in the first semester.', isPublished: true, publishedAt: new Date('2025-01-25') },
        { titleAr: 'اليوم الرياضي السنوي', titleEn: 'Annual Sports Day', bodyAr: 'يسعد إدارة المدرسة دعوة جميع الطلاب وأولياء الأمور لحضور اليوم الرياضي السنوي يوم الجمعة 28 مارس 2025.', bodyEn: 'The school is pleased to invite all students and parents to the Annual Sports Day on Friday, March 28, 2025.', isPublished: true, publishedAt: new Date('2025-03-15') },
        { titleAr: 'تذكير بسداد رسوم العام الدراسي 2025/2026', titleEn: 'Reminder: Academic Year 2025/2026 Fees', bodyAr: 'نذكر أولياء الأمور الذين لم يسددوا الرسوم بضرورة التوجه للإدارة المالية قبل نهاية أكتوبر 2025.', bodyEn: 'Parents who have not yet paid the annual fees are reminded to visit the accounts office before end of October 2025.', isPublished: true, publishedAt: new Date('2025-10-01') },
        { titleAr: 'بداية العام الدراسي 2025/2026', titleEn: 'New Academic Year 2025/2026', bodyAr: 'نرحب بجميع الطلاب الجدد والقدامى في بداية العام الدراسي الجديد 2025/2026. نتمنى للجميع عاماً دراسياً موفقاً.', bodyEn: 'We welcome all new and returning students to the new academic year 2025/2026.', isPublished: true, publishedAt: new Date('2025-09-01') },
        { titleAr: 'إجازة عيد الأضحى المبارك', titleEn: 'Eid Al-Adha Holiday', bodyAr: 'تعلن إدارة المدرسة عن إجازة عيد الأضحى المبارك من 4 حتى 10 يونيو 2025. نتمنى للجميع عيداً مباركاً سعيداً.', bodyEn: 'The school announces Eid Al-Adha holiday from June 4 to June 10, 2025.', isPublished: true, publishedAt: new Date('2025-05-30') },
      ],
    })
  }

  // ── 16. Calendar events (keep/recreate) ─────────────────────────────────────
  const existingCal = await prisma.calendarEvent.count()
  if (existingCal === 0) {
    console.log('  Creating calendar events...')
    await prisma.calendarEvent.createMany({
      data: [
        { titleAr: 'بداية العام الدراسي 2025/2026', titleEn: 'New Academic Year Start', date: '2025-09-01', endDate: null, type: 'term',    color: '#06B6D4', isPublic: true },
        { titleAr: 'امتحانات نصف العام',             titleEn: 'Midterm Exams',           date: '2026-01-06', endDate: '2026-01-16', type: 'exam',    color: '#EF4444', isPublic: true },
        { titleAr: 'إجازة نصف العام',                titleEn: 'Mid-Year Break',          date: '2026-01-17', endDate: '2026-01-23', type: 'holiday', color: '#10B981', isPublic: true },
        { titleAr: 'اليوم الرياضي السنوي',           titleEn: 'Annual Sports Day',       date: '2026-03-27', endDate: null,          type: 'event',   color: '#3B82F6', isPublic: true },
        { titleAr: 'امتحانات نهاية العام',           titleEn: 'Final Exams',             date: '2026-06-01', endDate: '2026-06-18', type: 'exam',    color: '#EF4444', isPublic: true },
        { titleAr: 'حفل نهاية العام',                titleEn: 'End of Year Ceremony',    date: '2026-06-25', endDate: null,          type: 'event',   color: '#8B5CF6', isPublic: true },
        { titleAr: 'إجازة صيفية',                   titleEn: 'Summer Vacation',         date: '2026-06-26', endDate: '2026-08-31', type: 'holiday', color: '#10B981', isPublic: true },
      ],
    })
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!')
  console.log(`  Student files:    ${excelStudents.length} (from Excel)`)
  console.log(`  Fee records:      ${feeRows.length} (from Excel)`)
  console.log(`  Expenses:         ${excelExpenses.length} (from Excel)`)
  console.log(`  Applications:     ${excelApps.length} (from Excel, all pending)`)
  console.log(`  Parent accounts:  ${excelParents.length} (from Excel)`)
  console.log(`  Bus riders:       ${busRiderRows.length} (reassigned to Excel students)`)
  console.log(`  Attendance:       ${attendanceRows.length} (6 days × ${excelStudents.length} students)`)
  console.log(`  Conduct notes:    ${conductRows.length}`)
  console.log(`  Results kept:     72 students, 2 semesters (seats 1001-1072 unchanged)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
