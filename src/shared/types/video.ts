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
  prompt?: string
  aspect_ratio?: string
  duration?: number
  mode?: VideoMode
  video_url?: string
  cover_url?: string
  error_message?: string
  created_at: number
  isFavorite?: boolean
}

// 视频日志 IPC 通道
export const VIDEO_IPC_CHANNELS = {
  VIDEO_LOG: 'video:log'
} as const
