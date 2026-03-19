export type VideoMode = 'std' | 'pro' | 'multi_shot'

export interface VideoSubmitParams {
  prompt: string
  image_url?: string
  image_tail_url?: string
  duration: number
  aspect_ratio: '16:9' | '9:16' | '1:1'
  mode: VideoMode
}

export interface VideoTask {
  task_id: string
  status: 'submitted' | 'processing' | 'succeed' | 'failed'
  video_url?: string
  cover_url?: string
  error_message?: string
  created_at: number
}
