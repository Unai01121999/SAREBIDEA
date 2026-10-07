// Códigos de 6 cifras (TOTP, RFC 6238) compatibles con Google Authenticator, Authy, 1Password…
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function randomSecret(bytes = 20): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes))
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const c of clean) bits += ALPHABET.indexOf(c).toString(2).padStart(5, '0')
  const out = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  return out
}

async function codeAt(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', base32Decode(secret) as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const msg = new ArrayBuffer(8)
  new DataView(msg).setBigUint64(0, BigInt(counter))
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg))
  const o = h[h.length - 1] & 0xf
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}

/** Acepta el código actual y el de 30 s antes o después (relojes desajustados). */
export async function verifyTotp(secret: string, code: string, now = Date.now()): Promise<boolean> {
  const c = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(c)) return false
  const t = Math.floor(now / 30_000)
  for (const d of [0, -1, 1]) if ((await codeAt(secret, t + d)) === c) return true
  return false
}

export const otpauthUri = (secret: string, account: string, issuer = 'SAREBIDEA') =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

export { codeAt as _codeAt }
