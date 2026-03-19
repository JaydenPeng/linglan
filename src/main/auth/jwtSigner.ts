import { createHmac } from 'crypto'

let cachedToken: string | null = null
let tokenExpiry = 0

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function getKlingToken(ak: string, sk: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  // 有效期剩余 > 60s 时复用缓存
  if (cachedToken && tokenExpiry - now > 60) {
    return cachedToken
  }
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: ak,
    exp: now + 1800,
    nbf: now - 5  // 防时钟偏差，避免错误码 1003
  }))
  const signingInput = `${header}.${payload}`
  const sig = createHmac('sha256', sk).update(signingInput).digest()
  const token = `${signingInput}.${base64url(sig)}`
  cachedToken = token
  tokenExpiry = now + 1800
  return token
}

export function invalidateKlingToken(): void {
  cachedToken = null
  tokenExpiry = 0
}
