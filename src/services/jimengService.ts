/**
 * 即梦 API 服务（移动端直调）
 * 使用 crypto-js 复现主进程的 HMAC-SHA256 签名逻辑
 */

import CryptoJS from 'crypto-js'

const SERVICE = 'cv'
const REGION = 'cn-north-1'
const HOST = 'visual.volcengineapi.com'

function sha256Hex(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

function hmacSHA256(key: CryptoJS.lib.WordArray | string, data: string): CryptoJS.lib.WordArray {
  return CryptoJS.HmacSHA256(data, key)
}

/**
 * 生成即梦 API 请求签名 Headers
 * 复现 src/main/api/hmacSigner.ts 的签名逻辑（浏览器兼容）
 */
export function buildJimengHeaders(
  method: string,
  path: string,
  body: string,
  ak: string,
  sk: string
): Record<string, string> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')   // YYYYMMDD
  const dateTimeStr = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z' // YYYYMMDDTHHmmssZ

  // 分离 path 和 query
  const [urlPath, queryString = ''] = path.split('?')
  const canonicalUri = urlPath || '/'

  // 规范化 query string（按 key 排序）
  const canonicalQueryString = queryString
    .split('&')
    .filter(Boolean)
    .map((p) => {
      const [k, v = ''] = p.split('=')
      return `${encodeURIComponent(decodeURIComponent(k))}=${encodeURIComponent(decodeURIComponent(v))}`
    })
    .sort()
    .join('&')

  const contentType = body ? 'application/json' : ''
  const signedHeaders = body
    ? 'content-type;host;x-date'
    : 'host;x-date'

  const canonicalHeaders = body
    ? `content-type:${contentType}\nhost:${HOST}\nx-date:${dateTimeStr}\n`
    : `host:${HOST}\nx-date:${dateTimeStr}\n`

  const payloadHash = sha256Hex(body)

  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStr}/${REGION}/${SERVICE}/request`
  const stringToSign = [
    'HMAC-SHA256',
    dateTimeStr,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  // 多层 HMAC 签名
  const kDate = hmacSHA256(sk, dateStr)
  const kRegion = hmacSHA256(kDate, REGION)
  const kService = hmacSHA256(kRegion, SERVICE)
  const signingKey = hmacSHA256(kService, 'request')
  const signature = hmacSHA256(signingKey, stringToSign).toString(CryptoJS.enc.Hex)

  const authorization =
    `HMAC-SHA256 Credential=${ak}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers: Record<string, string> = {
    'X-Date': dateTimeStr,
    'Authorization': authorization,
    'Host': HOST,
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}
