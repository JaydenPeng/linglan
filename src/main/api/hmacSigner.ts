import * as crypto from 'crypto'

/**
 * 即梦（火山引擎）HMAC-SHA256 请求签名
 * 参考：https://www.volcengine.com/docs/6348/65568
 */

const SERVICE = 'cv'
const REGION = 'cn-north-1'
const HOST = 'visual.volcengineapi.com'

function hmacSHA256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

/**
 * 生成即梦 API 请求签名 Headers
 * @param method  HTTP 方法，如 'POST' / 'GET'
 * @param path    请求路径含 query，如 '/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
 * @param body    请求体字符串（GET 请求传空字符串）
 * @param ak      Access Key ID
 * @param sk      Secret Access Key
 * @returns       需要附加到请求的 Headers 对象
 */
export function signRequest(
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

  const signingKey = hmacSHA256(
    hmacSHA256(
      hmacSHA256(
        hmacSHA256(Buffer.from(`${sk}`, 'utf8'), dateStr),
        REGION
      ),
      SERVICE
    ),
    'request'
  )

  const signature = hmacSHA256(signingKey, stringToSign).toString('hex')

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
