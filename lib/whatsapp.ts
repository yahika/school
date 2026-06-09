// Shared UltraMsg WhatsApp sender — used by buses (delay alerts) and
// accounts (fee reminders). Requires ULTRAMSG_INSTANCE + ULTRAMSG_TOKEN env vars.

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const instance = process.env.ULTRAMSG_INSTANCE
  const token    = process.env.ULTRAMSG_TOKEN
  if (!instance || !token) {
    console.warn('[WhatsApp] ULTRAMSG_INSTANCE or ULTRAMSG_TOKEN not set — message not sent')
    return false
  }
  // Normalise: strip non-digits, ensure Egyptian prefix
  const phone = to.replace(/\D/g, '').replace(/^0/, '20')
  if (!phone) return false
  try {
    const res = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token, to: phone, body: message }),
    })
    return res.ok
  } catch (err) {
    console.error('[WhatsApp] send error', err)
    return false
  }
}
