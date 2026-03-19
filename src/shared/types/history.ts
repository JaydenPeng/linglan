export type HistoryRecordType = 'image' | 'video'

export interface HistoryRecord {
  id: string
  type: HistoryRecordType
  prompt: string
  result_url: string
  cover_url?: string
  status: 'succeed' | 'failed'
  created_at: number
  is_favorite: boolean
}
