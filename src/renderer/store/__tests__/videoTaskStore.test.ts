import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVideoTaskStore } from '../videoTaskStore'

// Mock window.electron.ipcRenderer
const mockInvoke = vi.fn()
vi.stubGlobal('window', {
  electron: {
    ipcRenderer: {
      invoke: mockInvoke,
    },
  },
})

describe('videoTaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始状态 tasks 为空，submitting 为 false', () => {
    const store = useVideoTaskStore()
    expect(store.tasks).toEqual([])
    expect(store.submitting).toBe(false)
  })

  it('submitTask 成功后将任务加入列表头部', async () => {
    mockInvoke.mockResolvedValueOnce({ task_id: 'task-001' })
    const store = useVideoTaskStore()
    await store.submitTask({
      prompt: '测试视频',
      duration: 5,
      aspect_ratio: '16:9',
      mode: 'std',
    })
    expect(store.tasks).toHaveLength(1)
    expect(store.tasks[0].task_id).toBe('task-001')
    expect(store.tasks[0].status).toBe('submitted')
  })

  it('submitTask 期间 submitting 为 true，完成后为 false', async () => {
    let resolveSubmit!: (v: unknown) => void
    mockInvoke.mockReturnValueOnce(new Promise(r => { resolveSubmit = r }))
    const store = useVideoTaskStore()
    const p = store.submitTask({ prompt: '测试', duration: 5, aspect_ratio: '16:9', mode: 'std' })
    expect(store.submitting).toBe(true)
    resolveSubmit({ task_id: 'task-002' })
    await p
    expect(store.submitting).toBe(false)
  })

  it('submitTask 失败时不添加任务，submitting 恢复 false', async () => {
    mockInvoke.mockResolvedValueOnce({ error: 'API error' })
    const store = useVideoTaskStore()
    await store.submitTask({ prompt: '测试', duration: 5, aspect_ratio: '16:9', mode: 'std' })
    expect(store.tasks).toHaveLength(0)
    expect(store.submitting).toBe(false)
  })

  it('轮询成功后更新任务状态', async () => {
    mockInvoke
      .mockResolvedValueOnce({ task_id: 'task-003' })
      .mockResolvedValueOnce({
        task_id: 'task-003',
        status: 'succeed',
        video_url: 'https://example.com/video.mp4',
        cover_url: 'https://example.com/cover.jpg',
        created_at: Date.now(),
      })

    const store = useVideoTaskStore()
    await store.submitTask({ prompt: '测试', duration: 5, aspect_ratio: '16:9', mode: 'std' })
    expect(store.tasks[0].status).toBe('submitted')

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.tasks[0].status).toBe('succeed')
    expect(store.tasks[0].video_url).toBe('https://example.com/video.mp4')
  })

  it('任务 failed 后停止轮询', async () => {
    mockInvoke
      .mockResolvedValueOnce({ task_id: 'task-004' })
      .mockResolvedValueOnce({
        task_id: 'task-004',
        status: 'failed',
        error_message: '生成失败',
        created_at: Date.now(),
      })

    const store = useVideoTaskStore()
    await store.submitTask({ prompt: '测试', duration: 5, aspect_ratio: '16:9', mode: 'std' })
    await vi.advanceTimersByTimeAsync(3000)
    expect(store.tasks[0].status).toBe('failed')

    // 再推进 3 秒，invoke 不应再被调用
    await vi.advanceTimersByTimeAsync(3000)
    // invoke 调用次数：1次 submit + 1次 poll = 2次
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
