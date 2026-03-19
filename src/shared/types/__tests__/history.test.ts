import { describe, it, expect } from 'vitest'
import type { HistoryRecord, HistoryRecordType } from '../history'

describe('HistoryRecord 类型', () => {
  it('HistoryRecordType 只允许 image 或 video', () => {
    const t1: HistoryRecordType = 'image'
    const t2: HistoryRecordType = 'video'
    expect(t1).toBe('image')
    expect(t2).toBe('video')
  })

  it('HistoryRecord 包含所有必填字段', () => {
    const record: HistoryRecord = {
      id: 'rec-001',
      type: 'image',
      prompt: '金色草原日落',
      result_url: 'https://example.com/img.jpg',
      status: 'succeed',
      created_at: 1700000000000,
      is_favorite: false,
    }
    expect(record.id).toBe('rec-001')
    expect(record.type).toBe('image')
    expect(record.prompt).toBe('金色草原日落')
    expect(record.result_url).toBe('https://example.com/img.jpg')
    expect(record.status).toBe('succeed')
    expect(record.created_at).toBe(1700000000000)
    expect(record.is_favorite).toBe(false)
  })

  it('HistoryRecord cover_url 是可选字段', () => {
    const withCover: HistoryRecord = {
      id: 'rec-002',
      type: 'video',
      prompt: '海浪拍打礁石',
      result_url: 'https://example.com/vid.mp4',
      cover_url: 'https://example.com/cover.jpg',
      status: 'succeed',
      created_at: 1700000000001,
      is_favorite: true,
    }
    expect(withCover.cover_url).toBe('https://example.com/cover.jpg')

    const withoutCover: HistoryRecord = {
      id: 'rec-003',
      type: 'image',
      prompt: '雪山',
      result_url: 'https://example.com/img2.jpg',
      status: 'failed',
      created_at: 1700000000002,
      is_favorite: false,
    }
    expect(withoutCover.cover_url).toBeUndefined()
  })

  it('status 只允许 succeed 或 failed', () => {
    const s1: HistoryRecord['status'] = 'succeed'
    const s2: HistoryRecord['status'] = 'failed'
    expect(s1).toBe('succeed')
    expect(s2).toBe('failed')
  })
})
