<template>
  <ion-card class="task-card">
    <!-- 状态标签（右上角） -->
    <div class="status-badge" :class="statusClass">{{ statusLabel }}</div>

    <ion-card-content>
      <!-- 提示词预览 -->
      <p class="prompt-preview">{{ task.params.prompt }}</p>

      <!-- 处理中：进度条动画 -->
      <ion-progress-bar v-if="isActive" type="indeterminate" />

      <!-- 成功：缩略图 -->
      <div v-if="task.status === TaskStatus.SUCCESS && task.resultUrls?.length" class="thumbnails">
        <img
          v-for="(url, i) in task.resultUrls"
          :key="i"
          :src="url"
          class="thumbnail"
          @click="$emit('preview', { task, index: i })"
        />
      </div>

      <!-- 失败：错误信息 -->
      <p v-if="task.status === TaskStatus.FAILED" class="error-msg">{{ task.errorMsg }}</p>

      <!-- 操作按钮行 -->
      <div class="actions">
        <span class="time">{{ timeAgo }}</span>
        <ion-button v-if="task.status === TaskStatus.FAILED" size="small" fill="outline" @click="$emit('retry', task)">
          重试
        </ion-button>
        <ion-button v-if="isActive" size="small" fill="outline" color="medium" @click="$emit('cancel', task)">
          取消
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonCard, IonCardContent, IonProgressBar, IonButton } from '@ionic/vue'
import { TaskStatus } from '../types/image'
import type { ImageTask } from '../types/image'

const props = defineProps<{ task: ImageTask }>()
defineEmits<{
  preview: [{ task: ImageTask; index: number }]
  retry: [task: ImageTask]
  cancel: [task: ImageTask]
}>()

const isActive = computed(() =>
  props.task.status === TaskStatus.PENDING || props.task.status === TaskStatus.PROCESSING
)

const statusLabel = computed(() => ({
  [TaskStatus.PENDING]: '已提交',
  [TaskStatus.PROCESSING]: '处理中',
  [TaskStatus.SUCCESS]: '成功',
  [TaskStatus.FAILED]: '失败',
  [TaskStatus.CANCELLED]: '已取消',
}[props.task.status]))

const statusClass = computed(() => ({
  [TaskStatus.PENDING]: 'status-pending',
  [TaskStatus.PROCESSING]: 'status-processing',
  [TaskStatus.SUCCESS]: 'status-success',
  [TaskStatus.FAILED]: 'status-failed',
  [TaskStatus.CANCELLED]: 'status-cancelled',
}[props.task.status]))

const timeAgo = computed(() => {
  const diff = Date.now() - props.task.createdAt
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  return `${Math.floor(diff / 3600000)} 小时前`
})
</script>

<style scoped>
.task-card { position: relative; margin: 8px 16px; border-radius: 12px; }
.status-badge {
  position: absolute; top: 8px; right: 8px;
  padding: 2px 8px; border-radius: 8px; font-size: 12px; font-weight: 600;
}
.status-pending { background: #e8f4fd; color: #1a73e8; }
.status-processing { background: #fff3e0; color: #f57c00; }
.status-success { background: #e8f5e9; color: #2e7d32; }
.status-failed { background: #fce4ec; color: #c62828; }
.status-cancelled { background: #f5f5f5; color: #757575; }
.prompt-preview { margin: 0 0 8px; font-size: 14px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.thumbnails { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; }
.error-msg { color: var(--ion-color-danger); font-size: 13px; margin: 4px 0; }
.actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.time { font-size: 12px; color: var(--ion-color-medium); }
</style>
