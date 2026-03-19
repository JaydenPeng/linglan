import CryptoJS from 'crypto-js'

function sign(key: CryptoJS.lib.WordArray | string, msg: string): CryptoJS.lib.WordArray {
  return CryptoJS.HmacSHA256(msg, key)
}

export function buildJimengAuthHeaders(
  ak: string,
  sk: string,
  action: string,
  body: string
): Record<string, string> {
  const now = new Date()
  // X-Date 格式：YYYYMMDDTHHmmssZ（去掉 -: 和毫秒）
  const xDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const datestamp = xDate.slice(0, 8)
  const region = 'cn-north-1'
  const service = 'cv'

  const payloadHash = CryptoJS.SHA256(body).toString()
  // Query 参数必须按字母序：Action < Version（A < V，正确）
  const canonicalQuerystring = `Action=${action}&Version=2022-08-31`
  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:visual.volcengineapi.com\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${xDate}\n`
  const signedHeaders = 'content-type;host;x-content-sha256;x-date'
  const canonicalRequest =
    `POST\n/\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const credentialScope = `${datestamp}/${region}/${service}/request`
  const stringToSign =
    `HMAC-SHA256\n${xDate}\n${credentialScope}\n${CryptoJS.SHA256(canonicalRequest).toString()}`

  const kDate = sign(sk, datestamp)
  const kRegion = sign(kDate, region)
  const kService = sign(kRegion, service)
  const kSigning = sign(kService, 'request')
  const signature = sign(kSigning, stringToSign).toString()

  return {
    'X-Date': xDate,
    'X-Content-Sha256': payloadHash,
    'Content-Type': 'application/json',
    'Authorization':
      `HMAC-SHA256 Credential=${ak}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`
  }
}
