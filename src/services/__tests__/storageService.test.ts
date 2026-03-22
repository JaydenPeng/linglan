import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getItem, setItem, removeItem } from '../storageService'

// Mock @capacitor/preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}))

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setItem', () => {
    it('should call Preferences.set with key and value', async () => {
      const { Preferences } = await import('@capacitor/preferences')
      await setItem('test-key', 'test-value')

      expect(Preferences.set).toHaveBeenCalledWith({
        key: 'test-key',
        value: 'test-value'
      })
    })
  })

  describe('getItem', () => {
    it('should call Preferences.get and return value', async () => {
      const { Preferences } = await import('@capacitor/preferences')
      vi.mocked(Preferences.get).mockResolvedValue({ value: 'stored-value' })

      const result = await getItem('test-key')

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test-key' })
      expect(result).toBe('stored-value')
    })

    it('should return null when value is null', async () => {
      const { Preferences } = await import('@capacitor/preferences')
      vi.mocked(Preferences.get).mockResolvedValue({ value: null })

      const result = await getItem('test-key')

      expect(result).toBeNull()
    })
  })

  describe('removeItem', () => {
    it('should call Preferences.remove with key', async () => {
      const { Preferences } = await import('@capacitor/preferences')
      await removeItem('test-key')

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test-key' })
    })
  })
})
