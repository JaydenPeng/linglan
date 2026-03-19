import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VideoSubmitParams } from '@shared/types/video'

// Mock klingVideoApi
vi.mock('../api/klingVideoApi', () => ({
  submitVideoTask: vi.fn(),
  pollVideoTask: vi.fn()
}))

// Mock configStore
vi.mock('../store/configStore', () => ({
  getCredentials: vi.fn()
}))

// Mock jwtSigner
vi.mock('../auth/jwtSigner', () => ({
  getKlingToken: vi.fn()
}))

describe('registerVideoHandlers', () => {
  let ipcMain: { handle: ReturnType<typeof vi.fn> }
  let handlers: Record<string, (event: unknown, args: unknown) => Promise<unknown>>

  beforeEach(async () => {
    vi.resetAllMocks()
    handlers = {}
    ipcMain = {
      handle: vi.fn((channel: string, fn: (event: unknown, args: unknown) => Promise<unknown>) => {
        handlers[channel] = fn
      })
    }

    const { registerVideoHandlers } = await import('../ipc/videoHandlers')
    registerVideoHandlers(ipcMain as unknown as Electron.IpcMain)
  })

  it('注册 video:submit 和 video:poll 两个 channel', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('video:submit', expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith('video:poll', expect.any(Function))
  })

  it('video:submit 成功时返回 { task_id }', async () => {
    const { getCredentials } = await import('../store/configStore')
    const { getKlingToken } = await import('../auth/jwtSigner')
    const { submitVideoTask } = await import('../api/klingVideoApi')

    vi.mocked(getCredentials).mockReturnValue('ak').mockReturnValueOnce('ak').mockReturnValueOnce('sk')
    vi.mocked(getKlingToken).mockResolvedValue('mock-jwt')
    vi.mocked(submitVideoTask).mockResolvedValue('task-xyz')

    const params: VideoSubmitParams = {
      prompt: '测试视频',
      duration: 5,
      aspect_ratio: '16:9',
      mode: 'std'
    }
    const result = await handlers['video:submit'](null, params)
    expect(result).toEqual({ task_id: 'task-xyz' })
  })

  it('video:submit 失败时返回 { error }', async () => {
    const { getCredentials } = await import('../store/configStore')
    const { getKlingToken } = await import('../auth/jwtSigner')
    const { submitVideoTask } = await import('../api/klingVideoApi')

    vi.mocked(getCredentials).mockReturnValue('ak').mockReturnValueOnce('ak').mockReturnValueOnce('sk')
    vi.mocked(getKlingToken).mockResolvedValue('mock-jwt')
    vi.mocked(submitVideoTask).mockRejectedValue(new Error('API error'))

    const params: VideoSubmitParams = {
      prompt: '测试',
      duration: 5,
      aspect_ratio: '16:9',
      mode: 'std'
    }
    const result = await handlers['video:submit'](null, params)
    expect(result).toHaveProperty('error')
  })

  it('video:poll 成功时返回 VideoTask', async () => {
    const { getCredentials } = await import('../store/configStore')
    const { getKlingToken } = await import('../auth/jwtSigner')
    const { pollVideoTask } = await import('../api/klingVideoApi')

    vi.mocked(getCredentials).mockReturnValue('ak').mockReturnValueOnce('ak').mockReturnValueOnce('sk')
    vi.mocked(getKlingToken).mockResolvedValue('mock-jwt')
    vi.mocked(pollVideoTask).mockResolvedValue({
      task_id: 'task-xyz',
      status: 'succeed',
      video_url: 'https://example.com/video.mp4',
      created_at: 1700000000
    })

    const result = await handlers['video:poll'](null, { task_id: 'task-xyz' })
    expect(result).toMatchObject({ task_id: 'task-xyz', status: 'succeed' })
  })

  it('video:poll 失败时返回 { error }', async () => {
    const { getCredentials } = await import('../store/configStore')
    const { getKlingToken } = await import('../auth/jwtSigner')
    const { pollVideoTask } = await import('../api/klingVideoApi')

    vi.mocked(getCredentials).mockReturnValue('ak').mockReturnValueOnce('ak').mockReturnValueOnce('sk')
    vi.mocked(getKlingToken).mockResolvedValue('mock-jwt')
    vi.mocked(pollVideoTask).mockRejectedValue(new Error('poll error'))

    const result = await handlers['video:poll'](null, { task_id: 'task-xyz' })
    expect(result).toHaveProperty('error')
  })
})
