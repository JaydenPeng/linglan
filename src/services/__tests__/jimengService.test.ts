import { describe, it, expect, vi } from 'vitest'
import { buildJimengHeaders } from '../jimengService'

describe('jimengService', () => {
  describe('buildJimengHeaders', () => {
    it('should return headers with X-Date and Authorization', () => {
      const headers = buildJimengHeaders(
        'POST',
        '/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
        '{"test":"data"}',
        'test-ak',
        'test-sk'
      )

      expect(headers).toHaveProperty('X-Date')
      expect(headers).toHaveProperty('Authorization')
      expect(headers).toHaveProperty('Host')
    })

    it('should have Authorization starting with HMAC-SHA256 Credential=', () => {
      const headers = buildJimengHeaders(
        'POST',
        '/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
        '{"test":"data"}',
        'test-ak',
        'test-sk'
      )

      expect(headers.Authorization).toMatch(/^HMAC-SHA256 Credential=/)
    })

    it('should include Content-Type when body is provided', () => {
      const headers = buildJimengHeaders(
        'POST',
        '/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
        '{"test":"data"}',
        'test-ak',
        'test-sk'
      )

      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should not include Content-Type when body is empty', () => {
      const headers = buildJimengHeaders(
        'GET',
        '/?Action=GetTask&Version=2022-08-31',
        '',
        'test-ak',
        'test-sk'
      )

      expect(headers['Content-Type']).toBeUndefined()
    })
  })
})
