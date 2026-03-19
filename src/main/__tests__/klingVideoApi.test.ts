import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VideoSubmitParams, VideoTask } from '@shared/types/video'

// Mock Node.js https 模块
vi.mock('https', () => ({
  default: {
    request: vi.fn()
  },
  request: vi.fn()
}))

describe('submitVideoTask', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('调用 POST /v1/videos/omni-video 并返回 task_id', async () => {
    const https = await import('https')
    const mockTaskId = 'task-abc-123'

    const mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, cb: (data?: unknown) => void) => {
        if (event === 'data') cb(JSON.stringify({ data: { task_id: mockTaskId } }))
        if (event === 'end') cb()
        return mockResponse
      })
    }
    const mockReq = {
      on: vi.fn().mockReturnThis(),
      write: vi.fn(),
      end: vi.fn()
    }
    vi.mocked(https.request).mockImplementation((_opts: unknown, cb: unknown) => {
      ;(cb as (res: unknown) => void)(mockResponse)
      return mockReq as unknown as ReturnType<typeof https.request>
    })

    const { submitVideoTask } = await import('../api/klingVideoApi')
    const params: VideoSubmitParams = {
      prompt: '测试提示词',
      duration: 5,
      aspect_ratio: '16:9',
      mode: 'std'
    }
    const result = await submitVideoTask(params, 'mock-jwt-token')
    expect(result).toBe(mockTaskId)
  })

  it('mode="multi_shot" 时请求体中 mode 字段传 "multi_shot"', async () => {
    const https = await import('https')
    let capturedBody = ''

    const mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, cb: (data?: unknown) => void) => {
        if (event === 'data') cb(JSON.stringify({ data: { task_id: 'task-multi' } }))
        if (event === 'end') cb()
        return mockResponse
      })
    }
    const mockReq = {
      on: vi.fn().mockReturnThis(),
      write: vi.fn((body: string) => { capturedBody = body }),
      end: vi.fn()
    }
    vi.mocked(https.request).mockImplementation((_opts: unknown, cb: unknown) => {
      ;(cb as (res: unknown) => void)(mockResponse)
      return mockReq as unknown as ReturnType<typeof https.request>
    })

    const { submitVideoTask } = await import('../api/klingVideoApi')
    const params: VideoSubmitParams = {
      prompt: '多镜头测试',
      duration: 10,
      aspect_ratio: '16:9',
      mode: 'multi_shot'
    }
    await submitVideoTask(params, 'mock-jwt-token')
    const body = JSON.parse(capturedBody)
    expect(body.mode).toBe('multi_shot')
  })

  it('API 返回错误时抛出异常', async () => {
    const https = await import('https')

    const mockResponse = {
      statusCode: 400,
      on: vi.fn((event: string, cb: (data?: unknown) => void) => {
        if (event === 'data') cb(JSON.stringify({ message: 'Bad Request' }))
        if (event === 'end') cb()
        return mockResponse
      })
    }
    const mockReq = {
      on: vi.fn().mockReturnThis(),
      write: vi.fn(),
      end: vi.fn()
    }
    vi.mocked(https.request).mockImplementation((_opts: unknown, cb: unknown) => {
      ;(cb as (res: unknown) => void)(mockResponse)
      return mockReq as unknown as ReturnType<typeof https.request>
    })

    const { submitVideoTask } = await import('../api/klingVideoApi')
    const params: VideoSubmitParams = {
      prompt: '测试',
      duration: 5,
      aspect_ratio: '16:9',
      mode: 'std'
    }
    await expect(submitVideoTask(params, 'bad-token')).rejects.toThrow()
  })
})

describe('pollVideoTask', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('调用 GET /v1/videos/omni-video/{taskId} 并返回 VideoTask', async () => {
    const https = await import('https')
    const mockTask: VideoTask = {
      task_id: 'task-abc-123',
      status: 'succeed',
      video_url: 'https://example.com/video.mp4',
      cover_url: 'https://example.com/cover.jpg',
      created_at: 1700000000
    }

    const mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, cb: (data?: unknown) => void) => {
        if (event === 'data') cb(JSON.stringify({ data: { task_id: mockTask.task_id, task_status: mockTask.status, task_result: { videos: [{ url: mockTask.video_url, cover_image_url: mockTask.cover_url }] }, created_at: mockTask.created_at } }))
        if (event === 'end') cb()
        return mockResponse
      })
    }
    const mockReq = {
      on: vi.fn().mockReturnThis(),
      end: vi.fn()
    }
    vi.mocked(https.request).mockImplementation((_opts: unknown, cb: unknown) => {
      ;(cb as (res: unknown) => void)(mockResponse)
      return mockReq as unknown as ReturnType<typeof https.request>
    })

    const { pollVideoTask } = await import('../api/klingVideoApi')
    const result = await pollVideoTask('task-abc-123', 'mock-jwt-token')
    expect(result.task_id).toBe('task-abc-123')
    expect(result.status).toBe('succeed')
    expect(result.video_url).toBe('https://example.com/video.mp4')
  })

  it('任务处理中时返回 processing 状态', async () => {
    const https = await import('https')

    const mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, cb: (data?: unknown) => void) => {
        if (event === 'data') cb(JSON.stringify({ data: { task_id: 'task-proc', task_status: 'processing', created_at: 1700000000 } }))
        if (event === 'end') cb()
        return mockResponse
      })
    }
    const mockReq = {
      on: vi.fn().mockReturnThis(),
      end: vi.fn()
    }
    vi.mocked(https.request).mockImplementation((_opts: unknown, cb: unknown) => {
      ;(cb as (res: unknown) => void)(mockResponse)
      return mockReq as unknown as ReturnType<typeof https.request>
    })

    const { pollVideoTask } = await import('../api/klingVideoApi')
    const result = await pollVideoTask('task-proc', 'mock-jwt-token')
    expect(result.status).toBe('processing')
    expect(result.video_url).toBeUndefined()
  })
})
