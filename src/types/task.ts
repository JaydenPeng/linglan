export enum TaskStatus {
  PENDING = 'pending',       // 已提交，等待处理
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',       // 成功
  FAILED = 'failed',         // 失败
  CANCELLED = 'cancelled'    // 已取消
}

export enum TaskType {
  TEXT_TO_IMAGE = 'text_to_image',
  IMAGE_TO_IMAGE = 'image_to_image'
}
