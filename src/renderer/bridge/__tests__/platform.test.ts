import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isElectron, isCapacitor } from '../platform'

describe('platform detection', () => {
  beforeEach(() => {
    // 清理 window 对象
    delete (window as any).electron
    delete (window as any).Capacitor
  })

  describe('isElectron', () => {
    it('should return true when window.electron exists', () => {
      (window as any).electron = { getConfigStatus: vi.fn() }
      expect(isElectron()).toBe(true)
    })

    it('should return false when window.electron does not exist', () => {
      expect(isElectron()).toBe(false)
    })
  })

  describe('isCapacitor', () => {
    it('should return true when Capacitor.isNativePlatform() is true', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true
      }
      expect(isCapacitor()).toBe(true)
    })

    it('should return false when Capacitor does not exist', () => {
      expect(isCapacitor()).toBe(false)
    })

    it('should return false when isNativePlatform returns false', () => {
      (window as any).Capacitor = {
        isNativePlatform: () => false
      }
      expect(isCapacitor()).toBe(false)
    })
  })
})
