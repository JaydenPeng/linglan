import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HistoryRecord } from '@shared/types/history'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<HistoryRecord[]>([])

  function addRecord(record: HistoryRecord): void {
    records.value.unshift(record)
  }

  function toggleFavorite(id: string): void {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.is_favorite = !record.is_favorite
    }
  }

  function deleteRecord(id: string): void {
    records.value = records.value.filter(r => r.id !== id)
  }

  function getPromptById(id: string): string | undefined {
    return records.value.find(r => r.id === id)?.prompt
  }

  function filteredRecords(filter: 'all' | 'favorite'): HistoryRecord[] {
    if (filter === 'favorite') {
      return records.value.filter(r => r.is_favorite)
    }
    return records.value
  }

  return { records, addRecord, toggleFavorite, deleteRecord, getPromptById, filteredRecords }
}, {
  persist: {
    key: 'linglan-history',
  },
})
