import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

/** Deterministic score based on seat number + subject index */
function deterministicScore(seatNum: number, subjectIdx: number): number {
  const seed   = (seatNum * 17 + subjectIdx * 31) % 100
  const bucket = (seatNum + subjectIdx * 7) % 10
  if (bucket === 0) {
    // 10% fail: 20-49
    return 20 + (seed % 30)
  } else if (bucket <= 2) {
    // 20% average: 50-64
    return 50 + (seed % 15)
  } else if (bucket <= 4) {
    // ~20% excellent: 85-100
    return 85 + (seed % 16)
  } else {
    // 50% good: 65-84
    return 65 + (seed % 20)
  }
}

// ─── Data definitions ──────────────────────────────────────────────────────────

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

// ─── Student builder ──────────────────────────────────────────────────────────

interface Student {
  seatNumber:  string
  nameAr:      string
  nameEn:      string
  gradeAr:     string
  gradeEn:     string
  gradeIdx:    number
  dateOfBirth: string
  isFemale:    boolean
}

function buildStudents(): Student[] {
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
        seatNumber:  String(seatCounter++),
        nameAr:      `${firstAr} ${lastAr}`,
        nameEn:      `${firstEn} ${lastEn}`,
        gradeAr:     grade.ar,
        gradeEn:     grade.en,
        gradeIdx:    g,
        dateOfBirth: `${grade.birthYear}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        isFemale,
      })
    }
  }
  return students
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...')

  // ── 1. Hash passwords ──────────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash('Admin@2024!',  10)
  const staffHash  = await bcrypt.hash('Staff@2024!',  10)
  const parentHash = await bcrypt.hash('Parent@2024!', 10)

  // ── 2. Clear dependent data in safe order ──────────────────────────────────
  console.log('  Clearing old data...')
  await prisma.stockMovement.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.conductNote.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.busRider.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.feeRecord.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.contactMessage.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.examSchedule.deleteMany()
  await prisma.parentAccount.deleteMany()

  // ── 3. Admin ───────────────────────────────────────────────────────────────
  console.log('  Upserting admin...')
  await prisma.admin.upsert({
    where:  { username: 'admin' },
    update: { password: adminHash },
    create: { username: 'admin', password: adminHash },
  })

  // ── 4. Staff ───────────────────────────────────────────────────────────────
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

  // ── 5. Semesters ───────────────────────────────────────────────────────────
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

  // ── 6. Result Reviews ──────────────────────────────────────────────────────
  for (const sem of [sem1, sem2]) {
    await prisma.resultReview.upsert({
      where:  { semesterId: sem.id },
      update: { status: 'approved', reviewedBy: 'هاني الغزالي', reviewedAt: new Date() },
      create: { semesterId: sem.id, status: 'approved', reviewedBy: 'هاني الغزالي', reviewedAt: new Date() },
    })
  }

  // ── 7. Students: StudentFile + Results ────────────────────────────────────
  console.log('  Building students, files, and results...')
  const students = buildStudents()

  for (const st of students) {
    const sn = parseInt(st.seatNumber)

    // StudentFile
    await prisma.studentFile.upsert({
      where:  { seatNumber: st.seatNumber },
      update: {
        nameAr: st.nameAr, nameEn: st.nameEn, gradeAr: st.gradeAr, gradeEn: st.gradeEn,
        dateOfBirth: st.dateOfBirth,
        address: `شارع ${LAST_NAMES[sn % 10]} ${(sn % 50) + 1}، الإسكندرية`,
        guardianName: `ولي أمر ${st.nameAr}`,
        guardianPhone: `010${String(sn * 91 % 100000000).padStart(8, '0')}`,
        guardianRelation: 'أب',
        emergencyPhone: `011${String(sn * 73 % 100000000).padStart(8, '0')}`,
        enrollDate: '2024-09-01', status: 'active',
      },
      create: {
        seatNumber: st.seatNumber, nameAr: st.nameAr, nameEn: st.nameEn,
        gradeAr: st.gradeAr, gradeEn: st.gradeEn, dateOfBirth: st.dateOfBirth,
        address: `شارع ${LAST_NAMES[sn % 10]} ${(sn % 50) + 1}، الإسكندرية`,
        guardianName: `ولي أمر ${st.nameAr}`,
        guardianPhone: `010${String(sn * 91 % 100000000).padStart(8, '0')}`,
        guardianRelation: 'أب',
        emergencyPhone: `011${String(sn * 73 % 100000000).padStart(8, '0')}`,
        enrollDate: '2024-09-01', status: 'active',
      },
    })

    // Results for both semesters
    for (const sem of [sem1, sem2]) {
      const termOffset    = sem.id === 1 ? 0 : 3
      const subjectScores = SUBJECTS.map((subj, idx) => {
        const score = deterministicScore(sn + termOffset, idx)
        return { nameAr: subj.ar, nameEn: subj.en, score, maxScore: 100, passMark: 50, status: calcStatus(score, 100), orderIdx: idx }
      })
      const totalScore = subjectScores.reduce((a, b) => a + b.score, 0)
      const maxScore   = SUBJECTS.length * 100
      const percentage = (totalScore / maxScore) * 100

      const existing = await prisma.result.findUnique({
        where:  { semesterId_seatNumber: { semesterId: sem.id, seatNumber: st.seatNumber } },
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

  // ── 8. Buses ───────────────────────────────────────────────────────────────
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
      create: { code: b.code, routeAr: b.routeAr, driverName: b.driverName, driverPhone: b.driverPhone, capacity: b.capacity, status: b.status, monthlyFee: 500 },
    })
    busIds[b.code] = bus.id
  }

  // ── 9. BusRiders (skip BUS-03 maintenance) ────────────────────────────────
  console.log('  Creating bus riders...')
  const activeBusCodes = ['BUS-01', 'BUS-02', 'BUS-04', 'BUS-05']
  const ridersPerBus   = [30, 28, 32, 26]
  const busRiderRows: {
    busId: number; seatNumber: string; studentName: string; gradeAr: string
    pickupPoint: string; phone: string; isActive: boolean
  }[] = []

  let studentOffset = 0
  for (let bi = 0; bi < activeBusCodes.length; bi++) {
    const busId = busIds[activeBusCodes[bi]]
    const count = ridersPerBus[bi]
    for (let ri = 0; ri < count && studentOffset + ri < students.length; ri++) {
      const st = students[studentOffset + ri]
      busRiderRows.push({
        busId, seatNumber: st.seatNumber, studentName: st.nameAr, gradeAr: st.gradeAr,
        pickupPoint: `محطة ${ri + 1}`,
        phone: `010${String((parseInt(st.seatNumber) * 91) % 100000000).padStart(8, '0')}`,
        isActive: true,
      })
    }
    studentOffset += count
  }
  await prisma.busRider.createMany({ data: busRiderRows })

  // ── 10. FeeRecords ──────────────────────────────────────────────────────────
  console.log('  Creating fee records...')
  const feeRows = students.map((st, idx) => {
    const isPaid = idx < 50
    const paidAt = isPaid ? new Date(2024, 7 + Math.floor(idx / 8), (idx % 28) + 1) : null
    return {
      studentName: st.nameAr, seatNumber: st.seatNumber, gradeAr: st.gradeAr,
      amount: 18000, isPaid, paidAt, academicYear: '2024-2025',
      notes: isPaid ? 'تم السداد' : null,
    }
  })
  await prisma.feeRecord.createMany({ data: feeRows })

  // ── 11. Expenses (8 months Sep 2024 - Apr 2025) ────────────────────────────
  console.log('  Creating expenses...')
  const expenseRows: {
    date: string; category: string; description: string; amount: number; paidTo: string; recordedBy: string
  }[] = []
  const months = [
    { m: '09', y: '2024' }, { m: '10', y: '2024' }, { m: '11', y: '2024' }, { m: '12', y: '2024' },
    { m: '01', y: '2025' }, { m: '02', y: '2025' }, { m: '03', y: '2025' }, { m: '04', y: '2025' },
  ]
  for (const { m, y } of months) {
    expenseRows.push({ date: `${y}-${m}-01`, category: 'رواتب',   description: `رواتب شهر ${m}/${y}`,           amount: 85000, paidTo: 'موظفو المدرسة',    recordedBy: 'نادية السيد' })
    expenseRows.push({ date: `${y}-${m}-05`, category: 'مرافق',   description: `فواتير مرافق شهر ${m}/${y}`,   amount: 7500,  paidTo: 'شركة الكهرباء',   recordedBy: 'نادية السيد' })
    expenseRows.push({ date: `${y}-${m}-10`, category: 'مواصلات', description: `مصاريف مواصلات شهر ${m}/${y}`, amount: 2000,  paidTo: 'سائقو الباصات',   recordedBy: 'نادية السيد' })
  }
  expenseRows.push({ date: '2024-10-15', category: 'صيانة',    description: 'صيانة الباص BUS-03',           amount: 4000, paidTo: 'ورشة النور',          recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2024-12-20', category: 'صيانة',    description: 'صيانة مكيفات الفصول',          amount: 8000, paidTo: 'شركة الهواء البارد',  recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2025-03-08', category: 'صيانة',    description: 'إصلاح سباكة المبنى',           amount: 5500, paidTo: 'مؤسسة الإنشاءات',    recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2024-09-03', category: 'مستلزمات', description: 'مستلزمات مكتبية بداية العام',  amount: 3500, paidTo: 'محل القرطاسية',      recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2024-11-12', category: 'مستلزمات', description: 'مستلزمات مختبر العلوم',        amount: 3500, paidTo: 'شركة المعدات',       recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2025-01-20', category: 'مستلزمات', description: 'مستلزمات الفصل الثاني',        amount: 3500, paidTo: 'محل القرطاسية',      recordedBy: 'نادية السيد' })
  expenseRows.push({ date: '2025-04-05', category: 'مستلزمات', description: 'مستلزمات نهاية العام',          amount: 3500, paidTo: 'محل القرطاسية',      recordedBy: 'نادية السيد' })
  await prisma.expense.createMany({ data: expenseRows })

  // ── 12. Attendance (last 6 school days) ────────────────────────────────────
  console.log('  Creating attendance records...')
  const schoolDays = ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-14', '2026-06-15', '2026-06-16']
  const attendanceRows: {
    seatNumber: string; studentName: string; gradeAr: string; date: string; status: string; recordedBy: string
  }[] = []
  for (const day of schoolDays) {
    for (const st of students) {
      const seed = (parseInt(st.seatNumber) + day.charCodeAt(8) * 7) % 100
      let status: string
      if      (seed < 2)  status = 'excused'
      else if (seed < 5)  status = 'late'
      else if (seed < 10) status = 'absent'
      else                status = 'present'
      attendanceRows.push({ seatNumber: st.seatNumber, studentName: st.nameAr, gradeAr: st.gradeAr, date: day, status, recordedBy: 'محمود رشاد' })
    }
  }
  await prisma.attendanceRecord.createMany({ data: attendanceRows, skipDuplicates: true })

  // ── 13. ConductNotes (20 records) ─────────────────────────────────────────
  console.log('  Creating conduct notes...')
  const conductTemplates = [
    { type: 'positive', description: 'تفوق ملحوظ في مادة الرياضيات'                 },
    { type: 'positive', description: 'مشاركة فعالة ومتميزة في الفصل'               },
    { type: 'positive', description: 'حصل على المركز الأول في مسابقة العلوم'        },
    { type: 'positive', description: 'سلوك مثالي وانضباط تام'                      },
    { type: 'positive', description: 'تقديم مشروع ممتاز في التربية الفنية'          },
    { type: 'positive', description: 'مساعدة زملائه في الفهم والاستيعاب'            },
    { type: 'positive', description: 'التزام بالواجبات المنزلية باستمرار'            },
    { type: 'positive', description: 'إبداع ملحوظ في مشروع الحاسوب'                },
    { type: 'negative', description: 'تأخر متكرر عن موعد الحضور'                  },
    { type: 'negative', description: 'مشاجرة مع زميل في الفناء'                    },
    { type: 'negative', description: 'إهمال الواجبات المنزلية لأسبوع كامل'          },
    { type: 'negative', description: 'الحديث بصوت مرتفع أثناء الحصة'              },
    { type: 'negative', description: 'الغياب بدون عذر مقبول'                       },
    { type: 'negative', description: 'عدم الالتزام بزي المدرسة'                    },
    { type: 'negative', description: 'إزعاج الزملاء خلال وقت المذاكرة'             },
    { type: 'negative', description: 'استخدام الهاتف المحمول أثناء الحصص'         },
    { type: 'negative', description: 'الخروج من الفصل دون إذن من المعلم'           },
    { type: 'note',     description: 'يحتاج متابعة خاصة في اللغة الإنجليزية'       },
    { type: 'note',     description: 'تم التواصل مع ولي الأمر بشأن الغياب المتكرر' },
    { type: 'note',     description: 'طالب يحتاج دعم نفسي واجتماعي'                },
  ]
  const conductRows = conductTemplates.map((c, i) => {
    const st = students[(i * 3 + 7) % students.length]
    const d  = new Date('2026-06-17')
    d.setDate(d.getDate() - (i + 1))
    return { seatNumber: st.seatNumber, studentName: st.nameAr, gradeAr: st.gradeAr, date: d.toISOString().split('T')[0], type: c.type, description: c.description, recordedBy: 'محمود رشاد' }
  })
  await prisma.conductNote.createMany({ data: conductRows })

  // ── 14. Inventory ───────────────────────────────────────────────────────────
  console.log('  Creating inventory items...')
  const allInventoryRows = [
    // Books (15 items) — indices 10 & 14 are below minThreshold
    { nameAr: 'كتاب الرياضيات الصف الأول',               nameEn: 'Math Book Grade 1',            category: 'كتب',      unit: 'نسخة', quantity: 120, minThreshold: 20, unitPrice:  45, supplier: 'دار المعارف' },
    { nameAr: 'كتاب العلوم الصف الثالث',                 nameEn: 'Science Book Grade 3',          category: 'كتب',      unit: 'نسخة', quantity: 100, minThreshold: 20, unitPrice:  45, supplier: 'دار المعارف' },
    { nameAr: 'كتاب العربي الصف الخامس',                 nameEn: 'Arabic Book Grade 5',           category: 'كتب',      unit: 'نسخة', quantity:  95, minThreshold: 20, unitPrice:  40, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الإنجليزي الصف السادس',              nameEn: 'English Book Grade 6',          category: 'كتب',      unit: 'نسخة', quantity:  90, minThreshold: 20, unitPrice:  55, supplier: 'دار المعارف' },
    { nameAr: 'كتاب التاريخ الصف الأول الإعدادي',        nameEn: 'History Book Grade 7',          category: 'كتب',      unit: 'نسخة', quantity:  85, minThreshold: 15, unitPrice:  40, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الجغرافيا الصف الثالث الإعدادي',     nameEn: 'Geography Book Grade 9',        category: 'كتب',      unit: 'نسخة', quantity:  80, minThreshold: 15, unitPrice:  40, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الكيمياء الصف الأول الثانوي',        nameEn: 'Chemistry Book Grade 10',       category: 'كتب',      unit: 'نسخة', quantity:  70, minThreshold: 15, unitPrice:  60, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الفيزياء الصف الثالث الثانوي',       nameEn: 'Physics Book Grade 12',         category: 'كتب',      unit: 'نسخة', quantity:  65, minThreshold: 15, unitPrice:  60, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الأحياء الصف الثاني الثانوي',        nameEn: 'Biology Book Grade 11',         category: 'كتب',      unit: 'نسخة', quantity:  75, minThreshold: 15, unitPrice:  60, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الحاسوب الصف الخامس',               nameEn: 'CS Book Grade 5',               category: 'كتب',      unit: 'نسخة', quantity: 110, minThreshold: 20, unitPrice:  50, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الرياضيات الصف الثالث الثانوي',      nameEn: 'Math Book Grade 12',            category: 'كتب',      unit: 'نسخة', quantity:  12, minThreshold: 20, unitPrice:  65, supplier: 'دار المعارف' }, // BELOW
    { nameAr: 'كتاب الدراسات الأول الإعدادي',            nameEn: 'Social Studies Grade 7',        category: 'كتب',      unit: 'نسخة', quantity:  88, minThreshold: 15, unitPrice:  40, supplier: 'دار المعارف' },
    { nameAr: 'كتاب التربية الإسلامية الأول الثانوي',    nameEn: 'Islamic Studies Grade 10',      category: 'كتب',      unit: 'نسخة', quantity:  72, minThreshold: 15, unitPrice:  35, supplier: 'دار المعارف' },
    { nameAr: 'كتاب الإنجليزي الصف الأول الثانوي',       nameEn: 'English Book Grade 10',         category: 'كتب',      unit: 'نسخة', quantity:  68, minThreshold: 15, unitPrice:  55, supplier: 'دار المعارف' },
    { nameAr: 'كتاب العربي الصف الثالث الثانوي',         nameEn: 'Arabic Book Grade 12',          category: 'كتب',      unit: 'نسخة', quantity:   9, minThreshold: 15, unitPrice:  40, supplier: 'دار المعارف' }, // BELOW
    // Uniform (5 items) — بنطلون رمادي below threshold
    { nameAr: 'قميص أبيض مقاس S',                        nameEn: 'White Shirt Size S',            category: 'يونيفورم', unit: 'قطعة', quantity:  80, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس M',                        nameEn: 'White Shirt Size M',            category: 'يونيفورم', unit: 'قطعة', quantity: 100, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس L',                        nameEn: 'White Shirt Size L',            category: 'يونيفورم', unit: 'قطعة', quantity:  90, minThreshold: 15, unitPrice: 120, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'قميص أبيض مقاس XL',                       nameEn: 'White Shirt Size XL',           category: 'يونيفورم', unit: 'قطعة', quantity:  60, minThreshold: 10, unitPrice: 130, supplier: 'مصنع الأزياء المدرسية' },
    { nameAr: 'بنطلون رمادي',                             nameEn: 'Grey Trousers',                  category: 'يونيفورم', unit: 'قطعة', quantity:   8, minThreshold: 20, unitPrice: 150, supplier: 'مصنع الأزياء المدرسية' }, // BELOW
    // Stationery (5 items)
    { nameAr: 'دفتر كبير',                               nameEn: 'Large Notebook',                category: 'قرطاسية',  unit: 'قطعة', quantity: 500, minThreshold:  50, unitPrice:   8, supplier: 'مستلزمات القلم' },
    { nameAr: 'قلم رصاص',                                nameEn: 'Pencil',                        category: 'قرطاسية',  unit: 'قطعة', quantity: 300, minThreshold:  50, unitPrice:   2, supplier: 'مستلزمات القلم' },
    { nameAr: 'ممحاة',                                   nameEn: 'Eraser',                        category: 'قرطاسية',  unit: 'قطعة', quantity: 200, minThreshold:  30, unitPrice:   1, supplier: 'مستلزمات القلم' },
    { nameAr: 'مسطرة',                                   nameEn: 'Ruler',                         category: 'قرطاسية',  unit: 'قطعة', quantity: 150, minThreshold:  30, unitPrice:   5, supplier: 'مستلزمات القلم' },
    { nameAr: 'أقلام ملونة',                             nameEn: 'Colored Pencils',               category: 'قرطاسية',  unit: 'قطعة', quantity: 120, minThreshold:  20, unitPrice:  15, supplier: 'مستلزمات القلم' },
  ]
  await prisma.inventoryItem.createMany({ data: allInventoryRows, skipDuplicates: true })

  // StockMovements (10 records)
  const createdItems = await prisma.inventoryItem.findMany({ select: { id: true, nameAr: true } })
  const itemMap      = new Map(createdItems.map(i => [i.nameAr, i.id]))

  const movementTemplates = [
    { nameAr: 'كتاب الرياضيات الصف الأول',  type: 'in',  qty:  50, date: '2024-09-01', reason: 'شراء بداية العام'          },
    { nameAr: 'قميص أبيض مقاس M',           type: 'in',  qty:  40, date: '2024-09-02', reason: 'شراء بداية العام'          },
    { nameAr: 'دفتر كبير',                  type: 'in',  qty: 200, date: '2024-09-03', reason: 'مخزون بداية العام'         },
    { nameAr: 'كتاب العلوم الصف الثالث',    type: 'out', qty:  30, date: '2024-09-10', reason: 'توزيع على الطلاب'          },
    { nameAr: 'قميص أبيض مقاس S',           type: 'out', qty:  20, date: '2024-09-10', reason: 'مبيعات'                    },
    { nameAr: 'قلم رصاص',                   type: 'out', qty: 100, date: '2024-10-01', reason: 'توزيع على الفصول'          },
    { nameAr: 'كتاب الحاسوب الصف الخامس',   type: 'in',  qty:  30, date: '2024-10-15', reason: 'إضافة مخزون'              },
    { nameAr: 'بنطلون رمادي',               type: 'out', qty:  35, date: '2024-11-01', reason: 'مبيعات موسمية'             },
    { nameAr: 'ممحاة',                       type: 'out', qty:  60, date: '2025-01-15', reason: 'توزيع بداية الفصل الثاني' },
    { nameAr: 'أقلام ملونة',                type: 'in',  qty:  50, date: '2025-02-01', reason: 'تجديد مخزون'               },
  ]
  const stockRows = movementTemplates
    .map(m => {
      const id = itemMap.get(m.nameAr)
      if (!id) return null
      return { itemId: id, type: m.type, quantity: m.qty, date: m.date, reason: m.reason, recordedBy: 'سامي شاهين' }
    })
    .filter((r): r is { itemId: number; type: string; quantity: number; date: string; reason: string; recordedBy: string } => r !== null)
  await prisma.stockMovement.createMany({ data: stockRows })

  // ── 15. Announcements ───────────────────────────────────────────────────────
  console.log('  Creating announcements...')
  await prisma.announcement.createMany({
    data: [
      { titleAr: 'جدول امتحانات نهاية الفصل الدراسي الثاني', titleEn: 'Second Semester Final Exam Schedule',         bodyAr: 'يسر إدارة المدرسة إعلان جدول امتحانات نهاية الفصل الدراسي الثاني لعام 2024/2025. تبدأ الامتحانات يوم السبت 8 يونيو 2025.',    bodyEn: 'The school administration announces the second semester final exam schedule for 2024/2025. Exams begin Saturday, June 8, 2025.',    isPublished: true, publishedAt: new Date('2025-05-25') },
      { titleAr: 'تهنئة المتفوقين في الفصل الدراسي الأول',   titleEn: 'Congratulations to Top Students – First Semester', bodyAr: 'تتقدم إدارة المدرسة بخالص التهاني والتبريكات للطلاب الحاصلين على تقدير ممتاز في الفصل الأول 2024/2025.',               bodyEn: 'The school administration congratulates all students who achieved excellent grades in the first semester.',                        isPublished: true, publishedAt: new Date('2025-01-25') },
      { titleAr: 'اليوم الرياضي السنوي',                     titleEn: 'Annual Sports Day',                              bodyAr: 'يسعد إدارة المدرسة دعوة جميع الطلاب وأولياء الأمور لحضور اليوم الرياضي السنوي يوم الجمعة 28 مارس 2025.',               bodyEn: 'The school is pleased to invite all students and parents to the Annual Sports Day on Friday, March 28, 2025.',                   isPublished: true, publishedAt: new Date('2025-03-15') },
      { titleAr: 'رحلة مدرسية إلى مكتبة الإسكندرية',         titleEn: 'School Trip to Bibliotheca Alexandrina',          bodyAr: 'تنظم المدرسة رحلة علمية إلى مكتبة الإسكندرية لطلاب الصفوف السادسة والسابعة والتاسعة يوم الخميس 6 فبراير 2025.',         bodyEn: 'The school organizes an educational trip to the Bibliotheca Alexandrina for Grades 6, 7, and 9 on Thursday, February 6, 2025.', isPublished: true, publishedAt: new Date('2025-01-28') },
      { titleAr: 'تذكير بسداد رسوم العام الدراسي 2024/2025',  titleEn: 'Reminder: Academic Year 2024/2025 Fees',          bodyAr: 'نذكر أولياء الأمور الذين لم يسددوا الرسوم بضرورة التوجه للإدارة المالية قبل نهاية فبراير 2025.',                           bodyEn: 'Parents who have not yet paid the annual fees are reminded to visit the accounts office before the end of February 2025.',       isPublished: true, publishedAt: new Date('2025-02-01') },
      { titleAr: 'إجازة عيد الفطر المبارك',                  titleEn: 'Eid Al-Fitr Holiday',                            bodyAr: 'تعلن إدارة المدرسة عن إجازة عيد الفطر من 28 مارس حتى 5 أبريل 2025. نتمنى للجميع عيداً مباركاً سعيداً.',               bodyEn: 'The school announces the Eid Al-Fitr holiday from March 28 to April 5, 2025. Wishing everyone a blessed and happy Eid.',        isPublished: true, publishedAt: new Date('2025-03-20') },
    ],
  })

  // ── 16. Applications ────────────────────────────────────────────────────────
  console.log('  Creating applications...')
  await prisma.application.createMany({
    data: [
      { studentNameAr: 'زياد كريم أحمد',       studentNameEn: 'Ziad Karim Ahmed',      dateOfBirth: '2017-03-15', gradeApplying: 'الصف الثاني الابتدائي',  parentName: 'كريم أحمد',   parentPhone: '01234567801', parentEmail: 'karim.ahmed@gmail.com',  status: 'pending'  },
      { studentNameAr: 'ياسمين علي حسن',        studentNameEn: 'Yasmin Ali Hassan',     dateOfBirth: '2015-07-22', gradeApplying: 'الصف الرابع الابتدائي', parentName: 'علي حسن',     parentPhone: '01234567802', parentEmail: 'ali.hassan@gmail.com',   status: 'pending'  },
      { studentNameAr: 'عبدالرحمن سامي محمود',  studentNameEn: 'Abdulrahman Sami',      dateOfBirth: '2013-11-08', gradeApplying: 'الصف السادس الابتدائي', parentName: 'سامي محمود',   parentPhone: '01234567803',                                             status: 'pending'  },
      { studentNameAr: 'دينا خالد رشاد',        studentNameEn: 'Dina Khaled Rashad',    dateOfBirth: '2011-05-30', gradeApplying: 'الصف الثاني الإعدادي',  parentName: 'خالد رشاد',   parentPhone: '01234567804', parentEmail: 'khaled.rashad@yahoo.com', status: 'pending'  },
      { studentNameAr: 'تامر وليد السيد',       studentNameEn: 'Tamer Walid El-Sayed',  dateOfBirth: '2008-09-14', gradeApplying: 'الصف الثاني الثانوي',   parentName: 'وليد السيد',   parentPhone: '01234567805',                                             status: 'pending'  },
      { studentNameAr: 'نهال أيمن الشريف',      studentNameEn: 'Nahal Ayman El-Sharif', dateOfBirth: '2018-01-20', gradeApplying: 'الصف الأول الابتدائي',  parentName: 'أيمن الشريف', parentPhone: '01234567806', parentEmail: 'ayman.sharif@gmail.com', status: 'approved' },
      { studentNameAr: 'محمود جمال الغزالي',    studentNameEn: 'Mahmoud Gamal',          dateOfBirth: '2016-04-05', gradeApplying: 'الصف الثالث الابتدائي', parentName: 'جمال الغزالي', parentPhone: '01234567807',                                             status: 'approved' },
      { studentNameAr: 'لجين أسامة حسن',        studentNameEn: 'Lujain Osama Hassan',   dateOfBirth: '2012-08-17', gradeApplying: 'الصف الأول الإعدادي',   parentName: 'أسامة حسن',   parentPhone: '01234567808', parentEmail: 'osama.h@hotmail.com',    status: 'approved' },
      { studentNameAr: 'سيف الدين منصور سعيد',  studentNameEn: 'Seif El-Din Mansour',   dateOfBirth: '2010-12-25', gradeApplying: 'الصف الثالث الإعدادي',  parentName: 'منصور سعيد',  parentPhone: '01234567809',                                             status: 'approved' },
      { studentNameAr: 'رنا فتحي شاهين',        studentNameEn: 'Rana Fathy Shahin',     dateOfBirth: '2017-06-11', gradeApplying: 'الصف الأول الابتدائي',  parentName: 'فتحي شاهين',  parentPhone: '01234567810', parentEmail: 'fathy.sh@gmail.com',     status: 'rejected', notes: 'لم يستوفِ متطلبات القبول'  },
      { studentNameAr: 'كريم نبيل المصري',      studentNameEn: 'Karim Nabil El-Masry',  dateOfBirth: '2015-02-28', gradeApplying: 'الصف الرابع الابتدائي', parentName: 'نبيل المصري',  parentPhone: '01234567811',                                             status: 'rejected', notes: 'الفصل ممتلئ'                },
      { studentNameAr: 'سلمى حسام الدين',       studentNameEn: 'Salma Hossam',           dateOfBirth: '2009-10-03', gradeApplying: 'الصف الأول الثانوي',    parentName: 'حسام الدين',  parentPhone: '01234567812', parentEmail: 'hossam.d@gmail.com',     status: 'rejected', notes: 'لا تتوفر طاقة استيعابية'    },
    ],
  })

  // ── 17. CalendarEvents ──────────────────────────────────────────────────────
  console.log('  Creating calendar events...')
  await prisma.calendarEvent.createMany({
    data: [
      { titleAr: 'امتحانات نصف العام',         titleEn: 'Midterm Exams',           date: '2025-01-06', endDate: '2025-01-16', type: 'exam',    color: '#EF4444', descriptionAr: 'امتحانات نصف العام الدراسي الأول 2024/2025',          isPublic: true },
      { titleAr: 'إجازة نصف العام',            titleEn: 'Mid-Year Break',          date: '2025-01-17', endDate: '2025-01-23', type: 'holiday', color: '#10B981', descriptionAr: 'إجازة نصف العام الدراسي – أسبوع واحد',               isPublic: true },
      { titleAr: 'اليوم الرياضي السنوي',       titleEn: 'Annual Sports Day',       date: '2025-03-28', endDate: null,          type: 'event',   color: '#3B82F6', descriptionAr: 'يوم رياضي تنافسي لتشجيع روح الفريق',                 isPublic: true },
      { titleAr: 'رحلة مدرسية',               titleEn: 'School Trip',             date: '2025-02-06', endDate: null,          type: 'event',   color: '#F59E0B', descriptionAr: 'رحلة علمية إلى مكتبة الإسكندرية',                   isPublic: true },
      { titleAr: 'حفل نهاية العام',            titleEn: 'End of Year Ceremony',    date: '2025-06-25', endDate: null,          type: 'event',   color: '#8B5CF6', descriptionAr: 'حفل تكريم المتفوقين وختام العام الدراسي 2024/2025',  isPublic: true },
      { titleAr: 'امتحانات نهاية العام',       titleEn: 'Final Exams',             date: '2025-06-08', endDate: '2025-06-20', type: 'exam',    color: '#EF4444', descriptionAr: 'امتحانات نهاية الفصل الدراسي الثاني',                isPublic: true },
      { titleAr: 'بداية العام الدراسي الجديد', titleEn: 'New Academic Year Start', date: '2025-09-01', endDate: null,          type: 'term',    color: '#06B6D4', descriptionAr: 'انطلاق العام الدراسي 2025/2026',                      isPublic: true },
      { titleAr: 'إجازة صيفية',               titleEn: 'Summer Vacation',         date: '2025-06-26', endDate: '2025-08-31', type: 'holiday', color: '#10B981', descriptionAr: 'الإجازة الصيفية حتى بداية العام الدراسي الجديد',    isPublic: true },
    ],
  })

  // ── 18. ExamSchedule ────────────────────────────────────────────────────────
  console.log('  Creating exam schedule...')
  const examGrades = [GRADES[0], GRADES[2], GRADES[4], GRADES[6]]
  const examDates  = ['2025-06-08','2025-06-09','2025-06-10','2025-06-11','2025-06-12','2025-06-14','2025-06-15','2025-06-16']
  const examEntries = []
  for (let gi = 0; gi < examGrades.length; gi++) {
    const grade = examGrades[gi]
    for (let si = 0; si < SUBJECTS.length; si++) {
      examEntries.push({
        titleAr: `امتحان ${SUBJECTS[si].ar} - ${grade.ar}`, titleEn: `${SUBJECTS[si].en} Exam - ${grade.en}`,
        gradeAr: grade.ar, gradeEn: grade.en, subjectAr: SUBJECTS[si].ar, subjectEn: SUBJECTS[si].en,
        examDate: examDates[si], startTime: si % 2 === 0 ? '09:00' : '11:30', location: `قاعة ${gi + 1}`,
      })
    }
  }
  await prisma.examSchedule.createMany({ data: examEntries })

  // ── 19. ParentAccounts ──────────────────────────────────────────────────────
  console.log('  Creating parent accounts...')
  const parentStudents = [students[0], students[9], students[18], students[27], students[36]]
  for (let pi = 0; pi < 5; pi++) {
    const st = parentStudents[pi]
    await prisma.parentAccount.create({
      data: {
        name: `ولي أمر ${st.nameAr}`, email: `parent${pi + 1}@test.com`, password: parentHash,
        phone: `012${String((pi + 1) * 11111111).padStart(8, '0')}`,
        seatNumber: st.seatNumber, studentName: st.nameAr, gradeAr: st.gradeAr, gradeEn: st.gradeEn,
        isActive: true,
      },
    })
  }

  // ── 20. ContactMessages ─────────────────────────────────────────────────────
  console.log('  Creating contact messages...')
  await prisma.contactMessage.createMany({
    data: [
      { name: 'أحمد السيد',   phone: '01012345001', email: 'ahmed.s@gmail.com',   message: 'أود الاستفسار عن مواعيد التسجيل للعام القادم',         isRead: true  },
      { name: 'سامية حسن',    phone: '01012345002',                                message: 'هل تتوفر مقاعد في الصف الثالث الابتدائي؟',             isRead: true  },
      { name: 'رامي خالد',    phone: '01012345003', email: 'rami.k@yahoo.com',    message: 'أرجو الاطلاع على سياسة المنح الدراسية',                 isRead: false },
      { name: 'منى محمود',    phone: '01012345004',                                message: 'استفسار عن رسوم الباص لمنطقة سيدي بشر',                isRead: false },
      { name: 'طارق عبدالله', phone: '01012345005', email: 'tarek.a@hotmail.com', message: 'أود تغيير موعد مقابلة القبول المحددة ليوم الثلاثاء',   isRead: true  },
    ],
  })

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\nSeed completed successfully!')
  console.log(`  Students:       ${students.length}`)
  console.log(`  Semesters:      2  (published)`)
  console.log(`  Results:        ${students.length * 2}`)
  console.log(`  Staff accounts: ${staffData.length}`)
  console.log(`  Buses:          ${busesData.length}  (BUS-03 in maintenance)`)
  console.log(`  Bus riders:     ${busRiderRows.length}`)
  console.log(`  Fee records:    ${feeRows.length}  (50 paid, 22 unpaid)`)
  console.log(`  Expenses:       ${expenseRows.length}`)
  console.log(`  Attendance:     ${attendanceRows.length}  (${schoolDays.length} days × ${students.length} students)`)
  console.log(`  Conduct notes:  ${conductRows.length}`)
  console.log(`  Inventory:      ${allInventoryRows.length}  (3 below threshold)`)
  console.log(`  Stock moves:    ${stockRows.length}`)
  console.log(`  Announcements:  6`)
  console.log(`  Applications:   12  (5 pending, 4 approved, 3 rejected)`)
  console.log(`  Calendar:       8`)
  console.log(`  Parents:        5`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
