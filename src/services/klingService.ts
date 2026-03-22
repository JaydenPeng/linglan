/**
 * 可灵 API 服务（移动端直调）
 * 使用 crypto-js 复现主进程的 JWT HS256 签名逻辑
 */

import CryptoJS from 'crypto-js'

let cachedToken: string | null = null
let tokenExpiry = 0

function base64url(input: string | CryptoJS.lib.WordArray): string {
  let base64: string
  if (typeof input === 'string') {
    base64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input))
  } else {
    base64 = CryptoJS.enc.Base64.stringify(input)
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * 生成可灵 JWT Token
 * 复现 src/main/auth/jwtSigner.ts 的 JWT 签名逻辑（浏览器兼容）
 */
export function buildKlingToken(ak: string, sk: string): string {
  const now = Math.floor(Date.now() / 1000)

  // 有效期剩余 > 60s 时复用缓存
  if (cachedToken && tokenExpiry - now > 60) {
    return cachedToken
  }

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: ak,
    exp: now + 1800,
    nbf: now - 5  // 防时钟偏差
  }))

  const signingInput = `${header}.${payload}`
  const sig = CryptoJS.HmacSHA256(signingInput, sk)
  const token = `${signingInput}.${base64url(sig)}`

  cachedToken = token
  tokenExpiry = now + 1800
  return token
}

/**
 * 清除缓存的 token（用于密钥更新后）
 */
export function invalidateKlingToken(): void {
  cachedToken = null
  tokenExpiry = 0
}
