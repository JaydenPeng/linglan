import { describe, it, expect, vi } from 'vitest'
import { buildKlingToken } from '../klingService'

describe('klingService', () => {
  describe('buildKlingToken', () => {
    it('should return a three-part JWT string (header.payload.signature)', () => {
      const token = buildKlingToken('test-ak', 'test-sk')

      const parts = token.split('.')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBeTruthy() // header
      expect(parts[1]).toBeTruthy() // payload
      expect(parts[2]).toBeTruthy() // signature
    })

    it('should return cached token on second call', () => {
      const token1 = buildKlingToken('test-ak', 'test-sk')
      const token2 = buildKlingToken('test-ak', 'test-sk')

      expect(token1).toBe(token2)
    })

    it('should decode to valid JWT structure', () => {
      const token = buildKlingToken('test-ak', 'test-sk')
      const [headerB64, payloadB64] = token.split('.')

      // Base64url decode
      const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')))
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

      expect(header.alg).toBe('HS256')
      expect(header.typ).toBe('JWT')
      expect(payload.iss).toBe('test-ak')
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
      expect(payload.nbf).toBeLessThan(Date.now() / 1000)
    })
  })
})
