import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadFile } from '../downloadService'

// Mock platform detection
vi.mock('../../renderer/bridge/platform', () => ({
  isCapacitor: vi.fn(() => false)
}))

describe('downloadService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清理 DOM
    document.body.innerHTML = ''
  })

  describe('downloadFile - web path', () => {
    it('should create anchor element and trigger click', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      await downloadFile('https://example.com/test.jpg', 'test.jpg')

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })

    it('should set correct href and download attributes', async () => {
      let capturedAnchor: HTMLAnchorElement | null = null

      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          capturedAnchor = node
        }
        return node
      })

      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any)

      await downloadFile('https://example.com/test.jpg', 'test.jpg')

      expect(capturedAnchor).not.toBeNull()
      expect(capturedAnchor?.href).toBe('https://example.com/test.jpg')
      expect(capturedAnchor?.download).toBe('test.jpg')
    })
  })
})
