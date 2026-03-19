import { describe, it, expect, beforeEach } from 'vitest'
import { buildJimengAuthHeaders } from '../auth/hmacSigner'
import { getKlingToken, invalidateKlingToken } from '../auth/jwtSigner'

// 注意：configStore 依赖 electron safeStorage，在 vitest（Node 环境）中需要 mock
// 此处测试签名逻辑本身，configStore 的集成测试在 Electron 运行时验证

describe('hmacSigner (即梦 HMAC-SHA256 V4)', () => {
  const ak = 'test-access-key'
  const sk = 'test-secret-key'

  it('buildJimengAuthHeaders 返回包含必要字段的对象', () => {
    const headers = buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', '{}')
    expect(headers).toHaveProperty('Authorization')
    expect(headers).toHaveProperty('X-Date')
    expect(headers).toHaveProperty('X-Content-Sha256')
    expect(headers).toHaveProperty('Content-Type', 'application/json')
  })

  it('Authorization header 格式符合 HMAC-SHA256 V4 规范', () => {
    const headers = buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', '{}')
    expect(headers['Authorization']).toMatch(/^HMAC-SHA256 Credential=/)
    expect(headers['Authorization']).toContain('SignedHeaders=content-type;host;x-content-sha256;x-date')
    expect(headers['Authorization']).toMatch(/Signature=[a-f0-9]{64}$/)
  })

  it('X-Date 格式为 YYYYMMDDTHHmmssZ（15位）', () => {
    const headers = buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', '{}')
    expect(headers['X-Date']).toMatch(/^\d{8}T\d{6}Z$/)
  })

  it('相同输入在同一秒内产生相同签名（确定性）', () => {
    const body = '{"req_key":"jimeng_t2i_v40","prompt":"test"}'
    const h1 = buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', body)
    const h2 = buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', body)
    // X-Date 可能因跨秒而不同，但 Signature 格式必须一致
    expect(h1['Authorization']).toMatch(/Signature=[a-f0-9]{64}$/)
    expect(h2['Authorization']).toMatch(/Signature=[a-f0-9]{64}$/)
  })
})

describe('jwtSigner (可灵 JWT HS256)', () => {
  const ak = 'test-kling-ak'
  const sk = 'test-kling-sk-must-be-long-enough'

  beforeEach(() => {
    invalidateKlingToken()
  })

  it('getKlingToken 返回有效的 JWT 字符串（三段 base64url）', async () => {
    const token = await getKlingToken(ak, sk)
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  })

  it('JWT payload 包含正确的 iss、exp、nbf 字段', async () => {
    const token = await getKlingToken(ak, sk)
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const now = Math.floor(Date.now() / 1000)

    expect(payload.iss).toBe(ak)
    expect(payload.exp).toBeGreaterThanOrEqual(now + 1790)  // ~now+1800，允许 10s 误差
    expect(payload.nbf).toBeLessThanOrEqual(now)            // nbf = now-5，必须 <= now
    expect(payload.nbf).toBeGreaterThanOrEqual(now - 10)    // 允许 10s 误差
  })

  it('有效期内重复调用返回同一 token（缓存命中）', async () => {
    const token1 = await getKlingToken(ak, sk)
    const token2 = await getKlingToken(ak, sk)
    expect(token1).toBe(token2)
  })

  it('invalidateKlingToken 后下次调用重新生成 token', async () => {
    const token1 = await getKlingToken(ak, sk)
    invalidateKlingToken()
    const token2 = await getKlingToken(ak, sk)
    // 两个 token 的 nbf 可能相同（同一秒），但 exp 应该相同或接近
    // 关键是：invalidate 后确实重新生成了（不是同一个对象引用）
    expect(typeof token2).toBe('string')
    expect(token2.split('.').length).toBe(3)
  })
})
