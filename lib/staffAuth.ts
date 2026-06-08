import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'as-staff-token'
const EXPIRY = '8h'

export type Department = 'student_affairs' | 'buses' | 'accounts' | 'results_control' | 'inventory'

export interface DepartmentInfo {
  value: Department
  labelAr: string
  icon: string
  href: string
  descAr: string
}

// Single source of truth for department metadata — used by the staff login
// redirect, the admin "manage staff accounts" page, and the dashboard grid.
export const DEPARTMENTS: DepartmentInfo[] = [
  { value: 'student_affairs', labelAr: 'شؤون الطلبة', icon: '🎓', href: '/staff/student-affairs', descAr: 'ملفات الطلاب، الحضور والغياب، السلوك' },
  { value: 'buses', labelAr: 'الباصات', icon: '🚌', href: '/staff/buses', descAr: 'إدارة الباصات والسائقين وركاب كل خط' },
  { value: 'accounts', labelAr: 'حسابات الماليات', icon: '💰', href: '/staff/accounts', descAr: 'متابعة المصروفات والرسوم والمدفوعات' },
  { value: 'results_control', labelAr: 'كونترول النتائج', icon: '📋', href: '/staff/results-control', descAr: 'مراجعة واعتماد نتائج الفصول الدراسية' },
  { value: 'inventory', labelAr: 'المخازن والكتب واليونيفورم', icon: '📦', href: '/staff/inventory', descAr: 'مخزون الكتب والزي المدرسي والمستلزمات' },
]

export function departmentInfo(dep: string): DepartmentInfo | undefined {
  return DEPARTMENTS.find(d => d.value === dep)
}

export function departmentLabel(dep: string): string {
  return departmentInfo(dep)?.labelAr ?? dep
}

export function departmentHref(dep: string): string {
  return departmentInfo(dep)?.href ?? '/staff/login'
}

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env variable is not set')
  return new TextEncoder().encode(secret)
}

export interface StaffTokenPayload {
  staffId: number
  username: string
  name: string
  department: string
}

export async function signStaffToken(payload: StaffTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyStaffToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as StaffTokenPayload
  } catch {
    return null
  }
}

/** Called from Server Components / Route Handlers */
export async function getStaffFromCookies() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyStaffToken(token)
}

/** Called from middleware (uses request directly) */
export async function getStaffFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyStaffToken(token)
}

export function setStaffCookieHeader(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${isProduction ? '; Secure' : ''}`
}

export function clearStaffCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}
