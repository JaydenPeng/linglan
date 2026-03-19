import { TaskStatus, TaskType } from './task'

export { TaskStatus, TaskType }

// 即梦 API 图片参数
export interface ImageParams {
  prompt: string
  width?: number
  height?: number
  aspect_ratio?: string   // 如 "16:9", "1:1", "9:16"
  force_single?: boolean  // 强制单图输出
  ref_image?: string      // base64，图生图时使用
}

// 应用内任务对象
export interface ImageTask {
  id: string              // 本地 UUID
  jobId?: string          // 即梦 API 返回的 job_id
  type: TaskType
  status: TaskStatus
  params: ImageParams
  createdAt: number       // Date.now()
  updatedAt: number
  resultUrls?: string[]   // 成功后的图片 URL 列表（return_url=true）
  errorMsg?: string       // 失败原因
}

// IPC 通道常量（主进程和渲染进程共用）
export const IPC_CHANNELS = {
  IMAGE_SUBMIT: 'image:submit',
  IMAGE_CANCEL: 'image:cancel',
  IMAGE_STATUS_UPDATE: 'image:status-update',  // 主进程推送给渲染进程
  IMAGE_DOWNLOAD: 'image:download',            // 下载图片到本地
} as const
