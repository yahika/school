/**
 * Paymob payment-gateway helpers (Egypt).
 *
 * Flow used here is Paymob's "Intention API" + "Unified Checkout":
 *   1. We POST an intention (amount, currency, billing data) to Paymob.
 *   2. Paymob returns a `client_secret`.
 *   3. We redirect the parent to Paymob's hosted Unified Checkout page using
 *      that client secret — Paymob shows whichever methods are enabled on the
 *      merchant account (cards, Apple Pay, mobile wallets, etc.).
 *   4. Paymob calls our webhook (server-to-server) with the transaction result,
 *      signed with an HMAC we must verify before trusting it.
 *
 * Required environment variables (see .env.example):
 *   PAYMOB_SECRET_KEY     — secret API key from Paymob dashboard → Developers → API Keys
 *   PAYMOB_PUBLIC_KEY     — public key from the same page (safe to expose to the browser)
 *   PAYMOB_INTEGRATION_IDS— comma-separated integration ID(s) to offer at checkout
 *   PAYMOB_HMAC_SECRET    — HMAC secret from the integration's webhook settings
 */

import crypto from 'crypto'

const PAYMOB_BASE = 'https://accept.paymob.com'

export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_SECRET_KEY &&
    process.env.PAYMOB_PUBLIC_KEY &&
    process.env.PAYMOB_INTEGRATION_IDS &&
    process.env.PAYMOB_HMAC_SECRET
  )
}

interface BillingData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface CreateIntentionParams {
  amountCents: number
  specialReference: string
  description: string
  billing: BillingData
  extras?: Record<string, unknown>
}

interface CreateIntentionResult {
  checkoutUrl: string
  clientSecret: string
  paymobOrderId: string | null
  raw: unknown
}

/** Creates a Paymob payment intention and returns the hosted checkout URL. */
export async function createPaymentIntention(params: CreateIntentionParams): Promise<CreateIntentionResult> {
  const secretKey = process.env.PAYMOB_SECRET_KEY
  const publicKey = process.env.PAYMOB_PUBLIC_KEY
  const integrationIds = (process.env.PAYMOB_INTEGRATION_IDS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)

  if (!secretKey || !publicKey || integrationIds.length === 0) {
    throw new Error('Paymob is not configured — missing PAYMOB_SECRET_KEY / PAYMOB_PUBLIC_KEY / PAYMOB_INTEGRATION_IDS')
  }

  // Sanitize billing fields — Paymob rejects empty strings on some of these
  const b = params.billing
  const billing_data = {
    first_name: b.firstName?.trim() || 'Parent',
    last_name: b.lastName?.trim() || 'Guardian',
    email: b.email?.trim() || 'no-reply@example.com',
    phone_number: b.phone?.trim() || '+201000000000',
    apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA',
    city: 'Cairo', state: 'NA', country: 'EG', postal_code: 'NA',
  }

  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${secretKey}`,
    },
    body: JSON.stringify({
      amount_cents: params.amountCents,
      currency: 'EGP',
      payment_methods: integrationIds,
      special_reference: params.specialReference,
      billing_data,
      extras: params.extras ?? {},
      items: [{ name: params.description.slice(0, 60), amount_cents: params.amountCents, quantity: 1 }],
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.client_secret) {
    throw new Error(`Paymob intention request failed (${res.status}): ${JSON.stringify(data) || await res.text().catch(() => '')}`)
  }

  const clientSecret = data.client_secret as string
  const paymobOrderId =
    (data?.intention_order_id != null && String(data.intention_order_id)) ||
    (data?.order?.id != null && String(data.order.id)) ||
    null

  return {
    checkoutUrl: `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`,
    clientSecret,
    paymobOrderId,
    raw: data,
  }
}

// ── Webhook HMAC verification ────────────────────────────────────────────────
// Paymob signs each "transaction processed" callback with HMAC-SHA512 computed
// over a FIXED set of fields from the transaction object, taken in this exact
// (lexicographic) order, concatenated as plain strings, hashed with the
// integration's HMAC secret. We must recompute it and compare to be sure the
// callback genuinely came from Paymob (and not a forged request).
const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
] as const

function getNested(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

/** Recomputes Paymob's HMAC for a transaction object and compares it to the value Paymob sent. */
export function verifyPaymobHmac(transaction: Record<string, unknown>, receivedHmac: string | null | undefined): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET
  if (!secret || !receivedHmac) return false

  const concatenated = HMAC_FIELDS.map(field => {
    const value = getNested(transaction, field)
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    return String(value)
  }).join('')

  const computed = crypto.createHmac('sha512', secret).update(concatenated).digest('hex')

  // Constant-time comparison
  const a = Buffer.from(computed.toLowerCase())
  const c = Buffer.from(receivedHmac.toLowerCase())
  if (a.length !== c.length) return false
  return crypto.timingSafeEqual(a, c)
}

/** Generates a unique correlation id we send to Paymob and expect back in callbacks/extras. */
export function generateSpecialReference(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}
