import { describe, it } from 'vitest'

// Wave 0: 测试 stub — 这些测试在 Plan 03 实现鉴权逻辑后会变为真实测试
// 当前状态：todo（占位），确保测试框架可运行

describe('hmacSigner (即梦 HMAC-SHA256 V4)', () => {
  it.todo('buildJimengAuthHeaders 返回包含 Authorization、X-Date、X-Content-Sha256 的对象')
  it.todo('Authorization header 格式为 HMAC-SHA256 Credential=.../Signature=...')
  it.todo('X-Date 格式为 YYYYMMDDTHHmmssZ（15位）')
  it.todo('相同输入产生相同签名（确定性）')
})

describe('jwtSigner (可灵 JWT HS256)', () => {
  it.todo('getKlingToken 返回有效的 JWT 字符串（三段 base64url）')
  it.todo('JWT payload 包含 iss=ak、exp=now+1800、nbf=now-5')
  it.todo('token 在有效期内（exp-now > 60s）时复用缓存，不重新生成')
  it.todo('invalidateKlingToken 后下次调用重新生成 token')
})

describe('configStore (密钥存储)', () => {
  it.todo('saveCredentials 存储后 hasCredentials 返回 true')
  it.todo('getCredentials 返回解密后的原始字符串')
  it.todo('getConfigStatus 只返回布尔值，不返回明文密钥')
})
