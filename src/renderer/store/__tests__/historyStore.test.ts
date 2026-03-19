import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '../historyStore'
import type { HistoryRecord } from '@shared/types/history'

function makeRecord(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: 'rec-001',
    type: 'image',
    prompt: '测试提示词',
    result_url: 'https://example.com/img.jpg',
    status: 'succeed',
    created_at: Date.now(),
    is_favorite: false,
    ...overrides,
  }
}

describe('historyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态 records 为空数组', () => {
    const store = useHistoryStore()
    expect(store.records).toEqual([])
  })

  it('addRecord 将记录插入列表头部', () => {
    const store = useHistoryStore()
    const r1 = makeRecord({ id: 'rec-001', created_at: 1000 })
    const r2 = makeRecord({ id: 'rec-002', created_at: 2000 })
    store.addRecord(r1)
    store.addRecord(r2)
    expect(store.records[0].id).toBe('rec-002')
    expect(store.records[1].id).toBe('rec-001')
  })

  it('toggleFavorite 切换 is_favorite', () => {
    const store = useHistoryStore()
    store.addRecord(makeRecord({ id: 'rec-001', is_favorite: false }))
    store.toggleFavorite('rec-001')
    expect(store.records[0].is_favorite).toBe(true)
    store.toggleFavorite('rec-001')
    expect(store.records[0].is_favorite).toBe(false)
  })

  it('deleteRecord 从列表移除指定记录', () => {
    const store = useHistoryStore()
    store.addRecord(makeRecord({ id: 'rec-001' }))
    store.addRecord(makeRecord({ id: 'rec-002' }))
    store.deleteRecord('rec-001')
    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBe('rec-002')
  })

  it('getPromptById 返回对应记录的 prompt', () => {
    const store = useHistoryStore()
    store.addRecord(makeRecord({ id: 'rec-001', prompt: '金色草原日落' }))
    expect(store.getPromptById('rec-001')).toBe('金色草原日落')
  })

  it('getPromptById 找不到时返回 undefined', () => {
    const store = useHistoryStore()
    expect(store.getPromptById('not-exist')).toBeUndefined()
  })

  it('filteredRecords("all") 返回全部记录', () => {
    const store = useHistoryStore()
    store.addRecord(makeRecord({ id: 'rec-001', is_favorite: false }))
    store.addRecord(makeRecord({ id: 'rec-002', is_favorite: true }))
    expect(store.filteredRecords('all')).toHaveLength(2)
  })

  it('filteredRecords("favorite") 只返回收藏记录', () => {
    const store = useHistoryStore()
    store.addRecord(makeRecord({ id: 'rec-001', is_favorite: false }))
    store.addRecord(makeRecord({ id: 'rec-002', is_favorite: true }))
    const result = store.filteredRecords('favorite')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('rec-002')
  })
})
